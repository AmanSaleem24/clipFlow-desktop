import React from "react";
import { hidePluginWindow } from "./utils";
import { v4 as uuid } from "uuid";
import io from "socket.io-client"

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder | undefined;
let userId: string
let pendingChunks: Blob[] = []
let shouldProcessOnReconnect = false

const socket = io(import.meta.env.VITE_SOCKET_URL as string, {
  reconnection: true,
  reconnectionAttempts: 10,
  timeout: 15000,
  autoConnect: true,
})

socket.on("connect", () => {
  console.log("[recorder] socket connected", socket.id)
  if (!videoTransferFileName) return

  if (pendingChunks.length) {
    for (const chunk of pendingChunks) {
      socket.emit("video-chunks", {
        chunks: chunk,
        filename: videoTransferFileName,
      })
    }
    pendingChunks = []
  }

  if (shouldProcessOnReconnect && userId) {
    socket.emit("process-video", {
      filename: videoTransferFileName,
      userId,
    })
    shouldProcessOnReconnect = false
  }
})

socket.on("connect_error", (error) => {
  console.error("[recorder] socket connection error", error)
})

export const StartRecording = (onSources: {
  screen: string;
  audio: string;
  id: string;
}) => {
  // hidePluginWindow(true)
  videoTransferFileName = `${uuid()}-${onSources?.id.slice(0, 8)}.webm`;
  pendingChunks = []
  shouldProcessOnReconnect = false
  socket.connect()
  mediaRecorder?.start(1000);
};

export const onStopRecording = () => mediaRecorder?.stop();

export const stopRecording = () => {
    // finalize current recording and notify backend that no more chunks should arrive
    hidePluginWindow(false)
    if (!videoTransferFileName || !userId) return

    if (!socket.connected) {
      shouldProcessOnReconnect = true
      socket.connect()
      return
    }

    if (pendingChunks.length) {
      for (const chunk of pendingChunks) {
        socket.emit("video-chunks", {
          chunks: chunk,
          filename: videoTransferFileName,
        })
      }
      pendingChunks = []
    }

    socket.emit('process-video', {
        filename: videoTransferFileName,
        userId
    })
    shouldProcessOnReconnect = false
}

export const onDataAvailable = (e: BlobEvent) => {
    if (!e.data || e.data.size === 0 || !videoTransferFileName) return

    if (!socket.connected) {
      pendingChunks.push(e.data)
      return
    }

    socket.emit('video-chunks', {
        chunks: e.data,
        filename: videoTransferFileName
    })
}

export const selectSources = async (
  onSources: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement>,
) => {
  if (!onSources || !onSources.screen || !onSources.id) return false;

  try {
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: onSources.screen,
          minWidth: onSources.preset === "HD" ? 1920 : 1280,
          maxWidth: onSources.preset === "HD" ? 1920 : 1280,
          minHeight: onSources.preset === "HD" ? 1080 : 720,
          maxHeight: onSources.preset === "HD" ? 1080 : 720,
          frameRate: 30
        },
      },
    };
    userId = onSources.id;

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    let audioTracks: MediaStreamTrack[] = [];
    if (onSources.audio) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { deviceId: { exact: onSources.audio } },
        });
        audioTracks = audioStream.getTracks();
      } catch (error) {
        console.warn("Microphone permission unavailable, continuing with screen only.", error);
      }
    }

    if (videoElement.current) {
      videoElement.current.srcObject = stream;
      await videoElement.current.play();
    }

    const combinedStream = new MediaStream([
      ...stream.getTracks(),
      ...audioTracks
    ]);

    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm; codecs=vp9',
    });

    mediaRecorder.ondataavailable = onDataAvailable;
    // notify backend only after the recorder actually stops
    mediaRecorder.onstop = stopRecording;
    return true;
  } catch (error) {
    console.error("Failed to initialize screen capture source", error);
    return false;
  }
};
