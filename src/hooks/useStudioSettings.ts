import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useZodForm } from './useZodForm'
import { updateStudioSettingsSchema } from '@/schemas/studio-settings.schema'
import { updateStudioSettings } from '@/lib/utils'
import { toast } from 'sonner'

export const useStudioSettings = (
  id: string,
  screen?: string | null,
  audio?: string | null,
  preset?: 'HD' | 'SD',
  plan?: 'PRO' | 'FREE'
) => {
  const [onPreset, setPreset] = useState<'HD' | 'SD' | undefined>()
  const safeScreen = screen ?? ''
  const safeAudio = audio ?? ''
  const safePreset = preset ?? 'HD'

  const { register, watch } = useZodForm(updateStudioSettingsSchema, {
    screen: safeScreen,
    audio: safeAudio,
    preset: safePreset,
  })

  const { mutate, isPending } = useMutation({
    mutationKey: ['update-studio'],
    mutationFn: (data: {
      screen: string
      id: string
      audio: string
      preset: 'HD' | 'SD'
    }) => updateStudioSettings(data.id, data.screen, data.audio, data.preset),
    onSuccess: (data) => {
      return toast.success('Success', {
        description: data.message,
      })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Oops! something went wrong'
      toast.error('Error', {
        description: message,
      })
    },
  })
                                  
  useEffect(() => {
    if(screen && audio){
        window.ipcRenderer.send('media-sources',{
            screen,
            id:id,
            audio,
            preset,
            plan
        })
    }
  }, [audio, screen])

  useEffect(() => {
    const subscribe = watch((values) => {
        if (!values.screen || !values.audio || !values.preset) return
        setPreset(values.preset)
        mutate({
            screen: values.screen,
            id,
            audio: values.audio,
            preset: values.preset
        })
        window.ipcRenderer.send("media-sources", {
            screen: values.screen,
            id,
            audio: values.audio,
            preset: values.preset,
            plan
        })
    })

    return () => subscribe.unsubscribe()
  }, [id, mutate, plan, watch])

  return {register, isPending, onPreset}
}
