import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const onCloseApp = () => window.ipcRenderer.send('closeApp')

const httpsClient = axios.create({
  baseURL: import.meta.env.VITE_HOST_URL,
  timeout: 15000,
})

const requestApi = async <T>(
  method: "GET" | "POST",
  path: string,
  data?: unknown,
) => {
  if (import.meta.env.PROD) {
    const result = (await window.ipcRenderer.invoke("http-request", {
      url: `${import.meta.env.VITE_HOST_URL}${path}`,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
      },
    })) as { ok: boolean; status: number; data?: T; error?: string }

    if (!result.ok) {
      throw new Error(result.error || `Request failed (${result.status})`)
    }

    return result.data as T
  }

  const response = await httpsClient.request<T>({
    method,
    url: path,
    data,
    headers: {
      "Content-Type": "application/json",
    },
  })

  return response.data
}

export const fetchUserProfile = async (clerkId: string) => {
  const data = await requestApi<{
    status: number
    user: {
      subscription: {
        plan: "PRO" | "FREE"
      } | null
      studio: {
        id: string
        screen: string | null
        mic: string | null
        preset: "HD" | "SD"
        camera: string | null
        pundit: string | null
        userId: string | null
      } | null
      id: string
      email: string
      firstname: string | null
      lastname: string | null
      createdAt: Date
      clerkid: string
    } | null
  }>(`GET`, `/auth/${clerkId}`)

  console.log(data)
  return data
}

export const getMediaResources = async () => {
  const displays = await window.ipcRenderer.invoke('getSources')
  let enumeratedDevices = await window.navigator.mediaDevices.enumerateDevices()
  let audioInputs = enumeratedDevices.filter((device) => device.kind === 'audioinput')

  // Browsers/Electron can hide audio device metadata until microphone permission is requested.
  if (!audioInputs.length || audioInputs.every((device) => !device.label)) {
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      enumeratedDevices = await window.navigator.mediaDevices.enumerateDevices()
      audioInputs = enumeratedDevices.filter((device) => device.kind === 'audioinput')
    } catch (error) {
      console.warn('Microphone permission denied or unavailable', error)
    }
  }

  console.log("Getting Sources", {
    displays: displays.length,
    audioInputs: audioInputs.length,
  })

  return {displays, audio: audioInputs}
}

export const updateStudioSettings = async (
  id: string,
  screen: string,
  audio: string,
  preset: 'HD' | 'SD'
) => {
  return requestApi<{
    status: number
    message: string
  }>(
    "POST",
    `/studio/${id}`,
    {
      screen,
      audio,
      preset,
    }
  )
}


export const hidePluginWindow = (state: boolean) => {
  window.ipcRenderer.send("hide-plugin", {state})
}

export const videoRecordingTime = (ms: number) => {
  const second = Math.floor((ms / 1000) % 60).toString().padStart(2, '0')
  const minute = Math.floor((ms/1000 / 60) % 60).toString().padStart(2, '0')
  const hour = Math.floor((ms / 1000 / 60 / 60)).toString().padStart(2, '0')

  return {length: `${hour}:${minute}:${second}`, minute}
}

export const resizeWindow = (shrink: boolean) => {
  window.ipcRenderer.send('resize-studio', {shrink})
}
