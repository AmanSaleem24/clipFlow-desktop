import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const onCloseApp = () => window.ipcRenderer.send('closeApp')

const httpsClient = axios.create({
  baseURL: import.meta.env.VITE_HOST_URL
})

export const fetchUserProfile = async (clerkId: string) => {
  const response = await httpsClient.get(`/auth/${clerkId}`, {
    headers:{
      'Content-Type': 'application/json'
    }
  })
  console.log(response.data)
  return response.data
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
  const response = await httpsClient.post(
    `/studio/${id}`,
    {
      screen,
      audio,
      preset,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data
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