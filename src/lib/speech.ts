let currentAudio: HTMLAudioElement | null = null
let currentTimeout: number | null = null

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined'
}

function getYoudaoAudioUrl(text: string, lang: string): string {
  const type = lang.startsWith('en') ? '2' : '1'
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`
}

export function speak(text: string, lang: string = 'zh-CN', rate: number = 1): Promise<void> {
  return new Promise((resolve) => {
    stopSpeak()
    const url = getYoudaoAudioUrl(text, lang)
    const audio = new Audio(url)
    audio.playbackRate = rate
    currentAudio = audio
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      currentAudio = null
      resolve()
    }
    audio.onended = done
    audio.onerror = () => {
      if (!settled) {
        fallbackSpeak(text, lang, rate).then(done).catch(done)
      }
    }
    audio.play().catch(() => {
      if (!settled) {
        fallbackSpeak(text, lang, rate).then(done).catch(done)
      }
    })
  })
}

function fallbackSpeak(text: string, lang: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve()
      return
    }
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = rate
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
      currentTimeout = window.setTimeout(resolve, 8000)
    } catch {
      resolve()
    }
  })
}

export function stopSpeak(): void {
  if (currentAudio) {
    try { currentAudio.pause() } catch {}
    currentAudio = null
  }
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel() } catch {}
  }
}

export function speakSequence(items: Array<{ text: string; lang: string; gap?: number }>, onDone?: () => void): void {
  stopSpeak()
  let i = 0
  const next = async () => {
    if (i >= items.length) {
      onDone?.()
      return
    }
    const item = items[i++]
    const gap = item.gap ?? 300
    await speak(item.text, item.lang, 0.95)
    currentTimeout = window.setTimeout(next, gap)
  }
  next()
}
