import { onBeforeUnmount, ref } from 'vue'

interface Recording {
  key: string
  cancelled: boolean
  recorder?: MediaRecorder
  stream?: MediaStream
  chunks: Blob[]
  size: number
}

/** Одна запись на одно удержание, включая ожидание разрешения на микрофон. */
export function useHoldRecorder(onAudio: (audio: Blob) => void) {
  const phase = ref<'idle' | 'permission' | 'recording' | 'finishing'>('idle')
  const error = ref('')
  let current: Recording | undefined

  function stopTracks(recording: Recording) {
    recording.stream?.getTracks().forEach((track) => track.stop())
  }

  function cancel() {
    const recording = current
    if (!recording) return
    recording.cancelled = true
    current = undefined
    phase.value = 'idle'
    if (recording.recorder?.state === 'recording') recording.recorder.stop()
    stopTracks(recording)
  }

  async function start(key: string) {
    if (current) return
    error.value = ''
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      error.value = 'Запись недоступна. Откройте страницу по HTTPS или на localhost в браузере с поддержкой микрофона.'
      return
    }
    const recording: Recording = { key, cancelled: false, chunks: [], size: 0 }
    current = recording
    phase.value = 'permission'
    try {
      recording.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Палец мог быть поднят, пока браузер спрашивал разрешение.
      if (current !== recording) {
        stopTracks(recording)
        return
      }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(recording.stream, mimeType ? { mimeType } : undefined)
      recording.recorder = recorder
      recorder.ondataavailable = ({ data }) => {
        if (recording.cancelled || !data.size) return
        recording.size += data.size
        if (recording.size > 10 * 1024 * 1024) {
          cancel()
          error.value = 'Запись превышает 10 МиБ. Запишите более короткую реплику.'
          return
        }
        recording.chunks.push(data)
      }
      recorder.onerror = () => {
        if (current !== recording) return
        cancel()
        error.value = 'Не удалось записать звук. Проверьте микрофон и попробуйте ещё раз.'
      }
      recorder.onstop = () => {
        stopTracks(recording)
        if (current !== recording || recording.cancelled) return
        current = undefined
        phase.value = 'idle'
        const audio = new Blob(recording.chunks, { type: recorder.mimeType })
        if (audio.size) onAudio(audio)
        else error.value = 'Запись пуста. Удерживайте кнопку, пока говорите.'
      }
      recorder.start(1000)
      phase.value = 'recording'
    } catch (cause) {
      stopTracks(recording)
      if (current !== recording) return
      cancel()
      const name = cause instanceof DOMException ? cause.name : ''
      error.value = name === 'NotAllowedError'
        ? 'Разрешите доступ к микрофону в настройках браузера и попробуйте ещё раз.'
        : name === 'NotFoundError'
          ? 'Микрофон не найден. Подключите его и попробуйте ещё раз.'
          : 'Не удалось включить микрофон. Проверьте, не занят ли он другим приложением.'
    }
  }

  function release(key: string) {
    if (!current || current.key !== key) return
    if (phase.value === 'permission') {
      cancel()
    } else if (current.recorder?.state === 'recording') {
      phase.value = 'finishing'
      current.recorder.stop()
      stopTracks(current)
    }
  }

  onBeforeUnmount(cancel)
  return { phase, error, start, release, cancel }
}
