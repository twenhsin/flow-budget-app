// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

interface UseVoiceInputOptions {
  onFinal: (text: string) => void
  onInterim?: (text: string) => void
  silenceMs?: number
}

export const useVoiceInput = (options: UseVoiceInputOptions) => {
  const { onFinal, onInterim, silenceMs = 5000 } = options

  const isListening = ref(false)
  const interimTranscript = ref('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null
  let silenceTimer: ReturnType<typeof setTimeout> | null = null

  const resetSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer)
    silenceTimer = setTimeout(() => stopVoice(), silenceMs)
  }

  const startVoice = () => {
    if (import.meta.server) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    recognition = new SR()
    recognition.lang = 'zh-TW'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: AnyFn) => {
      resetSilenceTimer()
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const text = result[0].transcript.trim()
          interimTranscript.value = ''
          if (text) onFinal(text)
        }
        else {
          interimTranscript.value = result[0].transcript
          onInterim?.(result[0].transcript)
        }
      }
    }

    recognition.onerror = (event: AnyFn) => {
      if (event.error !== 'no-speech') stopVoice()
    }

    // continuous mode may stop unexpectedly on some browsers — restart if still active
    recognition.onend = () => {
      if (isListening.value) recognition?.start()
    }

    isListening.value = true
    interimTranscript.value = ''
    recognition.start()
    resetSilenceTimer()
  }

  const stopVoice = () => {
    isListening.value = false
    interimTranscript.value = ''
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
    try { recognition?.stop() } catch {}
    recognition = null
  }

  const toggleVoice = () => {
    if (isListening.value) stopVoice()
    else startVoice()
  }

  onUnmounted(() => stopVoice())

  return { isListening, interimTranscript, startVoice, stopVoice, toggleVoice }
}
