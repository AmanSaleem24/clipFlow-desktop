import { app, BrowserWindow, systemPreferences, ipcMain, desktopCapturer } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : path.join(process.env.APP_ROOT, "dist");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const isMac = process.platform === "darwin";
const useTransparentWindows = true;
let win = null;
let studio = null;
let floatingWebCam = null;
let windowsCreated = false;
const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 160;
const MAX_WINDOW_WIDTH = 640;
const MAX_WINDOW_HEIGHT = 720;
const STUDIO_TRAY_WIDTH = 430;
const STUDIO_TRAY_HEIGHT = 72;
const STUDIO_EXPANDED_HEIGHT = 210;
const clampSize = (value, min, max) => Math.min(Math.max(Math.ceil(value), min), max);
const toRendererUrl = (entryFile) => VITE_DEV_SERVER_URL ? new URL(entryFile, VITE_DEV_SERVER_URL).toString() : null;
const loadRendererEntry = (browserWindow, entryFile) => {
  if (VITE_DEV_SERVER_URL) {
    const url = toRendererUrl(entryFile);
    if (!url) throw new Error(`Unable to resolve dev URL for ${entryFile}`);
    browserWindow.loadURL(url);
    return;
  }
  browserWindow.loadFile(path.join(RENDERER_DIST, entryFile));
};
const attachWindowLifecycle = (name, browserWindow) => {
  browserWindow.once("ready-to-show", () => {
    console.log(`🪟 [${name}] ready-to-show`);
    browserWindow.show();
  });
  browserWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.log(`⚠️ [${name}] did-fail-load`, { errorCode, errorDescription, validatedURL });
    console.error(`[${name}] failed to load (${errorCode}): ${errorDescription} -> ${validatedURL}`);
    if (!browserWindow.isDestroyed() && !browserWindow.isVisible()) {
      browserWindow.show();
    }
  });
  browserWindow.on("closed", () => {
    console.log(`🧹 [${name}] closed`);
    if (name === "win") win = null;
    if (name === "studio") studio = null;
    if (name === "floatingWebCam") floatingWebCam = null;
  });
};
const createWindow = () => {
  if (win || studio || floatingWebCam) return;
  const baseWindowOptions = {
    frame: false,
    transparent: useTransparentWindows,
    alwaysOnTop: false,
    focusable: true,
    show: false,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname$1, "preload.mjs")
    }
  };
  win = new BrowserWindow({
    ...baseWindowOptions,
    title: "ClipFlow",
    width: 420,
    height: 220,
    minHeight: MIN_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    useContentSize: true,
    resizable: false
  });
  studio = new BrowserWindow({
    ...baseWindowOptions,
    title: "Studio Controls",
    width: STUDIO_TRAY_WIDTH,
    height: STUDIO_TRAY_HEIGHT,
    minHeight: STUDIO_TRAY_HEIGHT,
    maxHeight: STUDIO_EXPANDED_HEIGHT,
    minWidth: STUDIO_TRAY_WIDTH,
    maxWidth: STUDIO_TRAY_WIDTH,
    useContentSize: true,
    resizable: false
  });
  floatingWebCam = new BrowserWindow({
    ...baseWindowOptions,
    title: "Floating Webcam",
    width: 400,
    height: 200,
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400
  });
  attachWindowLifecycle("win", win);
  attachWindowLifecycle("studio", studio);
  attachWindowLifecycle("floatingWebCam", floatingWebCam);
  win.webContents.on("did-finish-load", () => {
    console.log("✅ [win] did-finish-load");
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  studio.webContents.on("did-finish-load", () => {
    console.log("✅ [studio] did-finish-load");
    studio == null ? void 0 : studio.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  floatingWebCam.webContents.on("did-finish-load", () => {
    console.log("✅ [floatingWebCam] did-finish-load");
    floatingWebCam == null ? void 0 : floatingWebCam.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  loadRendererEntry(win, "index.html");
  loadRendererEntry(studio, "studio.html");
  loadRendererEntry(floatingWebCam, "webcam.html");
  windowsCreated = true;
};
const registerMainIpc = () => {
  ipcMain.on("closeApp", (event) => {
    console.log("🔌 [ipcMain] closeApp", { senderId: event.sender.id });
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    const senderTitle = senderWindow == null ? void 0 : senderWindow.getTitle();
    senderWindow == null ? void 0 : senderWindow.destroy();
    const openWindows = BrowserWindow.getAllWindows();
    console.log("📊 [ipcMain] closeApp result", { senderTitle, openWindowCount: openWindows.length, isMac });
    if (!isMac && openWindows.length === 0) {
      console.log("🛑 [app] quitting after closeApp (no open windows)");
      app.quit();
      win = null;
      studio = null;
      floatingWebCam = null;
    }
  });
  ipcMain.on("resize-window", (_event, payload = {}) => {
    console.log("📏 [ipcMain] resize-window request", payload);
    if (!win || win.isDestroyed()) return;
    const { width, height } = payload;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    const nextWidth = clampSize(width, MIN_WINDOW_WIDTH, MAX_WINDOW_WIDTH);
    const nextHeight = clampSize(height, MIN_WINDOW_HEIGHT, MAX_WINDOW_HEIGHT);
    const [currentWidth, currentHeight] = win.getContentSize();
    if (currentWidth === nextWidth && currentHeight === nextHeight) return;
    win.setContentSize(nextWidth, nextHeight, true);
    console.log("📐 [ipcMain] resize-window applied", { nextWidth, nextHeight });
  });
  ipcMain.handle("getSources", async (_event, payload = {}) => {
    console.log("🖥️ [ipcMain] getSources request", payload);
    const sources = await desktopCapturer.getSources({
      thumbnailSize: { height: 180, width: 320 },
      fetchWindowIcons: true,
      types: ["window", "screen"],
      ...payload
    });
    console.log("🎞️ [ipcMain] getSources response", { count: sources.length });
    return sources;
  });
  ipcMain.on("media-sources", (_event, payload) => {
    console.log("📤 [ipcMain] media-sources", payload);
    studio == null ? void 0 : studio.webContents.send("profile-received", payload);
  });
  ipcMain.on("resize-studio", (_event, payload = {}) => {
    console.log("🎛️ [ipcMain] resize-studio request", payload);
    if (!studio || studio.isDestroyed()) return;
    if (payload.shrink) {
      studio.setContentSize(STUDIO_TRAY_WIDTH, STUDIO_TRAY_HEIGHT, true);
      console.log("📉 [ipcMain] resize-studio applied", { width: STUDIO_TRAY_WIDTH, height: STUDIO_TRAY_HEIGHT });
    } else {
      studio.setContentSize(STUDIO_TRAY_WIDTH, STUDIO_EXPANDED_HEIGHT, true);
      console.log("📈 [ipcMain] resize-studio applied", { width: STUDIO_TRAY_WIDTH, height: STUDIO_EXPANDED_HEIGHT });
    }
  });
  ipcMain.on("hide-plugin", (_event, payload) => {
    console.log("🙈 [ipcMain] hide-plugin", payload);
    win == null ? void 0 : win.webContents.send("hide-plugin", payload);
  });
};
app.on("window-all-closed", () => {
  console.log("🚪 [app] window-all-closed", { isMac });
  if (!isMac) {
    console.log("🛑 [app] quitting from window-all-closed");
    app.quit();
    win = null;
    studio = null;
    floatingWebCam = null;
    windowsCreated = false;
  }
});
app.on("activate", () => {
  const openWindowCount = BrowserWindow.getAllWindows().length;
  console.log("🔁 [app] activate", { openWindowCount });
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
const ensureScreenPermission = async () => {
  if (process.platform !== "darwin") return;
  const status = systemPreferences.getMediaAccessStatus("screen");
  if (status === "granted" || status === "restricted") return;
};
app.whenReady().then(async () => {
  console.log("🚀 [app] whenReady");
  await ensureScreenPermission();
  if (!windowsCreated) {
    console.log("🧩 [app] initializing IPC + windows");
    registerMainIpc();
    createWindow();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
