import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, resizeWindow, videoRecordingTime } from "@/lib/utils";
import { Cast, Pause, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const StudioTray = () => {
  const [preview, setPreview] = useState(false);
  const [onTimer, setOnTimer] = useState<string>('00:00:00')
  const [count, setCount] = useState(0)
  const [onSources, setOnSources] = useState<
  | {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
    plan: "PRO" | "FREE";
  }
  | undefined
  >(undefined);

  const clearTime = () => {
    setOnTimer('00:00:00')
    setCount(0)
  }

  const [recording, setRecording] = useState(false);
  const videoElement = useRef<HTMLVideoElement | null>(null);

  const ensureSourceSelection = async () => {
    if (!onSources) return false;
    return selectSources(onSources, videoElement);
  };
  
  const initialTime = new Date();
  useEffect(() => {
    if(!recording) return
    const recordTimeInterval = setInterval(() => {
      let time = count + (new Date().getTime() - initialTime.getTime())
      setCount(time)
      const recordingTime = videoRecordingTime(time)
      if(onSources?.plan === 'FREE' && recordingTime.minute == '05'){
        setRecording(false)
        clearTime()
        onStopRecording()
      }
      setOnTimer(recordingTime.length)
      if(time <= 0){
        setOnTimer('00:00:00')
        clearInterval(recordTimeInterval)
      }
    }, 1)
    return () => clearInterval(recordTimeInterval)
  }, [recording])

  useEffect(() => {
    const onProfileReceived = (_event: unknown, payload: typeof onSources) => {
      setOnSources(payload);
    };

    window.ipcRenderer.on("profile-received", onProfileReceived);
    return () => {
      if (typeof window.ipcRenderer.off === "function") {
        window.ipcRenderer.off("profile-received", onProfileReceived);
      }
    };
  }, []);

  useEffect(() => {
    window.ipcRenderer.send("resize-studio", { shrink: !preview });
    return () => {
      window.ipcRenderer.send("resize-studio", { shrink: true });
    };
  }, [preview]);

  useEffect(() => {
    if (!preview || !onSources) return;
    selectSources(onSources, videoElement);
  }, [preview, onSources?.screen, onSources?.audio, onSources?.preset]);


  return !onSources ? (
    <></>
  ) : (
    <div className="draggable relative inline-flex w-fit items-center bg-transparent px-2 py-1.5">
      {preview && (
        <div className="non-draggable absolute bottom-[calc(100%+8px)] left-1/2 z-10 flex h-20 w-45 -translate-x-1/2 items-center justify-center overflow-hidden rounded-sm bg-white shadow-[0_8px_20px_rgba(0,0,0,0.22)]">
          <video
            autoPlay
            muted
            playsInline
            ref={videoElement}
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute text-xs font-medium text-neutral-700/70">
          </span>
        </div>
      )}
      <div className="mx-auto flex h-13.5 w-101 items-center justify-between rounded-full border border-cyan-200/45 bg-[#0b0c12]/88 px-6 shadow-[inset_0_0_12px_rgba(56,189,248,0.14)]">
        <div
          {...(onSources && {
            onClick: async () => {
              const ok = await ensureSourceSelection();
              if (!ok) return;
              setRecording(true);
              StartRecording(onSources);
            },
          })}
          className={cn(
            "non-draggable relative cursor-pointer rounded-full transition-all hover:opacity-85",
            recording
              ? "h-6 w-6 bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.55)]"
              : "h-8 w-8 bg-rose-500 shadow-[0_0_7px_rgba(244,63,94,0.55)]",
          )}
        />
        {!recording ? 
        <Pause 
        className="non-draggable opacity-50"
        size={32}
        fill="white"
        stroke="none"
        /> : (
          <Square 
          size={32}
          className="non-draggable cursor-pointer hover:scale-110 transform transition duration-150"
          fill="white"
          onClick={() => {
            setRecording(false)
            clearTime()
            onStopRecording()
          }}
          stroke="white"
          />
        )}
        <Cast 
        onClick={async () => {
          const next = !preview;
          setPreview(next);
          if (next) {
            await ensureSourceSelection();
          }
        }}
        size={32}
        fill="white"
        className="non-draggable cursor-pointer hover:opacity-60"
        stroke="white"
        />
        <span className="non-draggable w-18.5 text-right text-md leading-none tabular-nums text-white/90">
          {recording ? onTimer : "00:00:00"}
        </span>
      </div>
    </div>
  );
};

export default StudioTray;
