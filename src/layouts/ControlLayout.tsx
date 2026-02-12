import { cn, onCloseApp } from '@/lib/utils'
import { UserButton } from '@clerk/clerk-react'
import { X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
    children: React.ReactNode
    className?: string
}

const ControlLayout = ({children, className}: Props) => {
    const [isVisible, setIsVisible] = useState<boolean>(false)
    const layoutRef = useRef<HTMLDivElement | null>(null)
    const resizeTimer = useRef<number | null>(null)
    const lastSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 })

    useEffect(() => {
      const handleHidePlugin = (_event: unknown, payload: { state?: boolean }) => {
        setIsVisible(Boolean(payload?.state))
      }

      window.ipcRenderer.on('hide-plugin', handleHidePlugin)
      return () => {
        window.ipcRenderer.off('hide-plugin', handleHidePlugin)
      }
    }, [])

    useEffect(() => {
      const layoutElement = layoutRef.current
      if (!layoutElement) return

      const notifyMainWithSize = () => {
        const rect = layoutElement.getBoundingClientRect()
        const nextWidth = Math.ceil(rect.width)
        const nextHeight = Math.ceil(rect.height)
        if (nextWidth <= 0 || nextHeight <= 0) return

        const changed =
          nextWidth !== lastSize.current.width || nextHeight !== lastSize.current.height
        if (!changed) return

        lastSize.current = { width: nextWidth, height: nextHeight }

        window.ipcRenderer.send('resize-window', {
          width: nextWidth,
          height: nextHeight,
        })
      }

      const scheduleResize = () => {
        if (resizeTimer.current !== null) {
          window.clearTimeout(resizeTimer.current)
        }
        resizeTimer.current = window.setTimeout(notifyMainWithSize, 120)
      }

      scheduleResize()

      const layoutObserver = new ResizeObserver(scheduleResize)
      layoutObserver.observe(layoutElement)

      window.addEventListener('resize', scheduleResize)

      return () => {
        if (resizeTimer.current !== null) {
          window.clearTimeout(resizeTimer.current)
        }
        layoutObserver.disconnect()
        window.removeEventListener('resize', scheduleResize)
      }
    }, [])

  return (
  <div
    ref={layoutRef}
    className={cn(
      className,
      isVisible && 'invisible',
      'bg-[#171717] border-2 border-neutral-700 flex px-1 flex-col rounded-3xl overflow-visible'
    )}
  >
    <div className="flex justify-between items-center px-4 py-3 draggable">
      <span className="non-draggable">
        <UserButton />
      </span>

      <X
        size={20}
        className="text-gray-400 non-draggable hover:text-white cursor-pointer"
        onClick={onCloseApp}
      />
    </div>

    <div className="flex-1 h-0 overflow-auto">
      {children}
    </div>
    <div className="px-4 pt-3 flex w-full">
        <div className="flex items-center gap-x-2">
          <img
            src="/clipFlow.svg"
            alt="app logo"
            className='w-10 h-10 '
          />
          <p className="text-white text-xl font-medium">ClipFlow</p>
        </div>
      </div>
  </div>
)


}

export default ControlLayout
