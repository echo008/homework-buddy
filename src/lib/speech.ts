export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, lang: string = 'zh-CN', rate: number = 0.9): void {
  if (!isTTSSupported()) {
    return
  }
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  } catch {
  }
}

export function stopSpeak(): void {
  if (!isTTSSupported()) {
    return
  }
  try {
    window.speechSynthesis.cancel()
  } catch {
  }
}
