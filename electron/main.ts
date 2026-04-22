import { app, BrowserWindow, desktopCapturer, ipcMain, systemPreferences } from 'electron'
import type { BrowserWindowConstructorOptions, SourcesOptions } from 'electron'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Resolve app paths used by both dev and production builds.
process.env.APP_ROOT = path.join(__dirname, '..')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : path.join(process.env.APP_ROOT, 'dist')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

const isMac = process.platform === 'darwin'
const useTransparentWindows = true

let win: BrowserWindow | null = null
let studio: BrowserWindow | null = null
let floatingWebCam: BrowserWindow | null = null
let windowsCreated = false

let rendererHttpServer: ReturnType<typeof createServer> | null = null
let rendererHttpOrigin: string | null = null

const MIN_WINDOW_WIDTH = 320
const MIN_WINDOW_HEIGHT = 160
const MAX_WINDOW_WIDTH = 640
const MAX_WINDOW_HEIGHT = 720
const STUDIO_TRAY_WIDTH = 430
const STUDIO_TRAY_HEIGHT = 72
const STUDIO_EXPANDED_HEIGHT = 210

const clampSize = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.ceil(value), min), max)

const toRendererUrl = (entryFile: string) =>
  VITE_DEV_SERVER_URL ? new URL(entryFile, VITE_DEV_SERVER_URL).toString() : null

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const getMimeType = (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase()
  const mimeByExtension: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json; charset=utf-8',
  }

  return mimeByExtension[extension] || 'application/octet-stream'
}

const getSafeRequestPath = (pathname: string) => {
  const decoded = decodeURIComponent(pathname)
  const cleanPath = decoded === '/' ? '/index.html' : decoded
  const normalized = path.normalize(cleanPath).replace(/^([.]{2}[/\\])+/, '')
  return normalized.startsWith('/') ? normalized.slice(1) : normalized
}

const serveRendererAsset = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://127.0.0.1')
    const safePath = getSafeRequestPath(requestUrl.pathname)
    const filePath = path.join(RENDERER_DIST, safePath)

    // Prevent path traversal beyond the renderer dist directory.
    if (!filePath.startsWith(RENDERER_DIST)) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    const file = await readFile(filePath)
    const contentType = getMimeType(filePath)
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    })
    res.end(file)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}

const ensureRendererHttpOrigin = async () => {
  if (VITE_DEV_SERVER_URL) return null
  if (rendererHttpOrigin) return rendererHttpOrigin

  await new Promise<void>((resolve, reject) => {
    rendererHttpServer = createServer((req, res) => {
      void serveRendererAsset(req, res)
    })

    rendererHttpServer.once('error', reject)
    rendererHttpServer.listen(0, '127.0.0.1', () => {
      const address = rendererHttpServer?.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve renderer HTTP server address'))
        return
      }

      rendererHttpOrigin = `http://127.0.0.1:${address.port}`
      console.log('🌐 [renderer] local server started', { origin: rendererHttpOrigin })
      resolve()
    })
  })

  return rendererHttpOrigin
}

const stopRendererHttpServer = async () => {
  if (!rendererHttpServer) return

  await new Promise<void>((resolve) => {
    rendererHttpServer?.close(() => resolve())
  })

  rendererHttpServer = null
  rendererHttpOrigin = null
}

const loadRendererEntry = async (browserWindow: BrowserWindow, entryFile: string) => {
  if (VITE_DEV_SERVER_URL) {
    const url = toRendererUrl(entryFile)
    if (!url) throw new Error(`Unable to resolve dev URL for ${entryFile}`)

    const maxAttempts = 20
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await browserWindow.loadURL(url)
        return
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }

        console.warn(`⏳ [renderer] retrying load (${attempt}/${maxAttempts})`, { entryFile, url })
        await wait(250)
      }
    }

    return
  }

  const rendererOrigin = await ensureRendererHttpOrigin()
  if (!rendererOrigin) {
    throw new Error(`Unable to resolve renderer origin for ${entryFile}`)
  }

  await browserWindow.loadURL(`${rendererOrigin}/${entryFile}`)
}

const attachWindowLifecycle = (name: 'win' | 'studio' | 'floatingWebCam', browserWindow: BrowserWindow) => {
  browserWindow.once('ready-to-show', () => {
    console.log(`🪟 [${name}] ready-to-show`)
    browserWindow.show()
  })

  browserWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.log(`⚠️ [${name}] did-fail-load`, { errorCode, errorDescription, validatedURL })
    console.error(`[${name}] failed to load (${errorCode}): ${errorDescription} -> ${validatedURL}`)
    if (!browserWindow.isDestroyed() && !browserWindow.isVisible()) {
      browserWindow.show()
    }
  })

  browserWindow.on('closed', () => {
    console.log(`🧹 [${name}] closed`)
    if (name === 'win') win = null
    if (name === 'studio') studio = null
    if (name === 'floatingWebCam') floatingWebCam = null
  })
}

const createWindow = async () => {
  if (win || studio || floatingWebCam) return

  const baseWindowOptions: BrowserWindowConstructorOptions = {
    frame: false,
    transparent: useTransparentWindows,
    alwaysOnTop: false,
    focusable: true,
    show: false,
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, 'preload.mjs'),
    },
  }

  win = new BrowserWindow({
    ...baseWindowOptions,
    title: 'ClipFlow',
    width: 420,
    height: 220,
    minHeight: MIN_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    useContentSize: true,
    resizable: false,
  })

  studio = new BrowserWindow({
    ...baseWindowOptions,
    title: 'Studio Controls',
    width: STUDIO_TRAY_WIDTH,
    height: STUDIO_TRAY_HEIGHT,
    minHeight: STUDIO_TRAY_HEIGHT,
    maxHeight: STUDIO_EXPANDED_HEIGHT,
    minWidth: STUDIO_TRAY_WIDTH,
    maxWidth: STUDIO_TRAY_WIDTH,
    useContentSize: true,
    resizable: false,
  })

  floatingWebCam = new BrowserWindow({
    ...baseWindowOptions,
    title: 'Floating Webcam',
    width: 400,
    height: 200,
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400,
  })

  attachWindowLifecycle('win', win)
  attachWindowLifecycle('studio', studio)
  attachWindowLifecycle('floatingWebCam', floatingWebCam)

  win.webContents.on('did-finish-load', () => {
    console.log('✅ [win] did-finish-load')
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  studio.webContents.on('did-finish-load', () => {
    console.log('✅ [studio] did-finish-load')
    studio?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  floatingWebCam.webContents.on('did-finish-load', () => {
    console.log('✅ [floatingWebCam] did-finish-load')
    floatingWebCam?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  const results = await Promise.allSettled([
    loadRendererEntry(win, 'index.html'),
    loadRendererEntry(studio, 'studio.html'),
    loadRendererEntry(floatingWebCam, 'webcam.html'),
  ])

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') return

    const windowName = index === 0 ? 'win' : index === 1 ? 'studio' : 'floatingWebCam'
    console.error(`❌ [${windowName}] renderer failed to load`, result.reason)
  })

  windowsCreated = true
}

const registerMainIpc = () => {
  ipcMain.on('closeApp', (event) => {
    console.log('🔌 [ipcMain] closeApp', { senderId: event.sender.id })
    // Close only the window that requested it; quit the app only when none remain (non‑macOS).
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    const senderTitle = senderWindow?.getTitle()
    senderWindow?.destroy()

    const openWindows = BrowserWindow.getAllWindows()
    console.log('📊 [ipcMain] closeApp result', { senderTitle, openWindowCount: openWindows.length, isMac })
    if (!isMac && openWindows.length === 0) {
      console.log('🛑 [app] quitting after closeApp (no open windows)')
      app.quit()
      win = null
      studio = null
      floatingWebCam = null
    }
  })

  ipcMain.on('resize-window', (_event, payload: { width?: number; height?: number } = {}) => {
    console.log('📏 [ipcMain] resize-window request', payload)
    if (!win || win.isDestroyed()) return

    const { width, height } = payload
    if (!Number.isFinite(width) || !Number.isFinite(height)) return

    const nextWidth = clampSize(width as number, MIN_WINDOW_WIDTH, MAX_WINDOW_WIDTH)
    const nextHeight = clampSize(height as number, MIN_WINDOW_HEIGHT, MAX_WINDOW_HEIGHT)
    const [currentWidth, currentHeight] = win.getContentSize()

    if (currentWidth === nextWidth && currentHeight === nextHeight) return
    win.setContentSize(nextWidth, nextHeight, true)
    console.log('📐 [ipcMain] resize-window applied', { nextWidth, nextHeight })
  })

  ipcMain.handle('getSources', async (_event, payload: Partial<SourcesOptions> = {}) => {
    console.log('🖥️ [ipcMain] getSources request', payload)
    const sources = await desktopCapturer.getSources({
      thumbnailSize: { height: 180, width: 320 },
      fetchWindowIcons: true,
      types: ['window', 'screen'],
      ...payload,
    })
    console.log('🎞️ [ipcMain] getSources response', { count: sources.length })
    return sources
  })

  ipcMain.handle(
    'http-request',
    async (
      _event,
      payload: {
        url: string
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
        data?: unknown
        headers?: Record<string, string>
      },
    ) => {
      const method = payload.method || 'GET'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch(payload.url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload.headers || {}),
          },
          body: method === 'GET' || payload.data === undefined ? undefined : JSON.stringify(payload.data),
          signal: controller.signal,
        })

        const text = await response.text()
        let data: unknown = null

        if (text) {
          try {
            data = JSON.parse(text)
          } catch {
            data = text
          }
        }

        if (!response.ok) {
          return {
            ok: false,
            status: response.status,
            error: typeof data === 'string' ? data : `Request failed with status ${response.status}`,
          }
        }

        return {
          ok: true,
          status: response.status,
          data,
        }
      } catch (error) {
        return {
          ok: false,
          status: 0,
          error: error instanceof Error ? error.message : 'Request failed',
        }
      } finally {
        clearTimeout(timeoutId)
      }
    },
  )

  ipcMain.on('media-sources', (_event, payload) => {
    console.log('📤 [ipcMain] media-sources', payload)
    studio?.webContents.send('profile-received', payload)
  })

  ipcMain.on('resize-studio', (_event, payload: { shrink?: boolean } = {}) => {
    console.log('🎛️ [ipcMain] resize-studio request', payload)
    if (!studio || studio.isDestroyed()) return

    if (payload.shrink) {
      studio.setContentSize(STUDIO_TRAY_WIDTH, STUDIO_TRAY_HEIGHT, true)
      console.log('📉 [ipcMain] resize-studio applied', { width: STUDIO_TRAY_WIDTH, height: STUDIO_TRAY_HEIGHT })
    } else {
      studio.setContentSize(STUDIO_TRAY_WIDTH, STUDIO_EXPANDED_HEIGHT, true)
      console.log('📈 [ipcMain] resize-studio applied', { width: STUDIO_TRAY_WIDTH, height: STUDIO_EXPANDED_HEIGHT })
    }
  })

  ipcMain.on('hide-plugin', (_event, payload) => {
    console.log('🙈 [ipcMain] hide-plugin', payload)
    win?.webContents.send('hide-plugin', payload)
  })
}

app.on('window-all-closed', async () => {
  console.log('🚪 [app] window-all-closed', { isMac })
  if (!isMac) {
    console.log('🛑 [app] quitting from window-all-closed')
    await stopRendererHttpServer()
    app.quit()
    win = null
    studio = null
    floatingWebCam = null
    windowsCreated = false
  }
})

app.on('before-quit', async () => {
  await stopRendererHttpServer()
})

app.on('activate', () => {
  const openWindowCount = BrowserWindow.getAllWindows().length
  console.log('🔁 [app] activate', { openWindowCount })
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow().catch((error) => {
      console.error('❌ [app] failed to create window on activate', error)
    })
  }
})

const ensureScreenPermission = async () => {
  if (process.platform !== 'darwin') return

  const status = systemPreferences.getMediaAccessStatus('screen')
  if (status === 'granted' || status === 'restricted') return
  // macOS shows the Screen Recording prompt automatically on first capture attempt;
  // Electron can't programmatically trigger it, so just log for visibility.
}

app.whenReady().then(async () => {
  console.log('🚀 [app] whenReady')
  await ensureScreenPermission()
  if (!windowsCreated) {
    console.log('🧩 [app] initializing IPC + windows')
    registerMainIpc()
    await createWindow().catch((error) => {
      console.error('❌ [app] failed to create initial windows', error)
    })
  }
})
