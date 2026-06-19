// pages/dictation/dictation.js - 听写进行页（核心）
const { speak, resolveLang } = require('../../utils/tts.js')

Page({
  data: {
    questions: [],
    currentIndex: 0,
    mode: 'en2cn',
    interval: 5,
    subject: 'english',
    userInput: '',
    answers: [],
    total: 0,
    isPlaying: false,
    unitIds: [],
    countdown: 0,
    hasCustomAudio: false
  },

  countdownTimer: null,

  onLoad(options) {
    const { mode, interval, subject } = options
    this.setData({
      mode: mode || 'en2cn',
      interval: Number(interval) || 5,
      subject: subject || 'english'
    })

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel && eventChannel.on) {
      eventChannel.on('dictationData', (data) => {
        const questions = data.questions || []
        this.setData({
          questions,
          total: data.total || questions.length,
          unitIds: data.unitIds || [],
          currentIndex: 0,
          userInput: '',
          answers: []
        })
        this.updateAudioFlag()
        this.playCurrent()
      })
    }
  },

  onUnload() {
    this.clearCountdown()
  },

  clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },

  updateAudioFlag() {
    const { questions, currentIndex } = this.data
    const current = questions[currentIndex]
    this.setData({
      hasCustomAudio: !!(current && current.audioUrl)
    })
  },

  // 播报当前题：优先使用自定义录音，否则用 TTS
  playCurrent() {
    const { questions, currentIndex } = this.data
    const current = questions[currentIndex]
    if (!current) return

    this.setData({ isPlaying: true })

    if (current.audioUrl) {
      playCustomAudio(current.audioUrl, {
        onEnd: () => this.setData({ isPlaying: false }),
        onError: () => this.setData({ isPlaying: false })
      })
    } else {
      const lang = resolveLang(current.promptType, this.data.subject)
      speak(current.prompt, lang, {
        onStart: () => this.setData({ isPlaying: true }),
        onEnd: () => this.setData({ isPlaying: false }),
        onError: () => this.setData({ isPlaying: false })
      })
    }
  },

  onReplay() {
    this.clearCountdown()
    this.playCurrent()
  },

  onInput(e) {
    this.setData({ userInput: e.detail.value })
  },

  onNext() {
    const { questions, currentIndex, userInput, answers } = this.data
    const current = questions[currentIndex]
    if (!current) return

    const normalizedUser = normalizeAnswer(userInput.trim(), current.answerType)
    const normalizedCorrect = normalizeAnswer(current.answer, current.answerType)

    const newAnswers = [...answers, {
      wordId: current.wordId,
      word: current.prompt,
      promptType: current.promptType,
      answerType: current.answerType,
      correctAnswer: current.answer,
      userAnswer: userInput.trim(),
      isCorrect: normalizedUser === normalizedCorrect
    }]

    this.setData({ answers: newAnswers, userInput: '' })

    if (currentIndex + 1 < questions.length) {
      const nextIndex = currentIndex + 1
      this.setData({ currentIndex: nextIndex })
      this.updateAudioFlag()
      this.startCountdown()
    } else {
      this.finish()
    }
  },

  startCountdown() {
    const { interval } = this.data
    this.clearCountdown()
    this.setData({ countdown: interval })

    this.countdownTimer = setInterval(() => {
      const { countdown } = this.data
      if (countdown <= 1) {
        this.clearCountdown()
        this.setData({ countdown: 0 })
        this.playCurrent()
      } else {
        this.setData({ countdown: countdown - 1 })
      }
    }, 1000)
  },

  finish() {
    const { answers, unitIds, mode, subject } = this.data
    const correctCount = answers.filter(a => a.isCorrect).length
    const total = answers.length
    const wrongCount = total - correctCount
    const accuracy = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0
    const wrongWords = answers.filter(a => !a.isCorrect)

    wx.redirectTo({
      url: '/pages/result/result',
      success: (nav) => {
        nav.eventChannel.emit('resultData', {
          answers, unitIds, mode, subject,
          total, correctCount, wrongCount, accuracy, wrongWords
        })
      }
    })
  }
})

function playCustomAudio(url, callbacks = {}) {
  const innerAudioContext = wx.createInnerAudioContext()
  innerAudioContext.src = url
  innerAudioContext.onPlay(() => {
    if (typeof callbacks.onStart === 'function') callbacks.onStart()
  })
  innerAudioContext.onEnded(() => {
    if (typeof callbacks.onEnd === 'function') callbacks.onEnd()
    innerAudioContext.destroy()
  })
  innerAudioContext.onError((err) => {
    console.error('自定义音频播放失败:', err)
    if (typeof callbacks.onError === 'function') callbacks.onError(err)
    innerAudioContext.destroy()
  })
  innerAudioContext.play()
}

function normalizeAnswer(value, answerType) {
  if (!value) return ''
  let normalized = value.trim()
  if (answerType === 'english') {
    normalized = normalized.toLowerCase().replace(/\s+/g, '')
  } else if (answerType === 'chinese' || answerType === 'pinyin') {
    normalized = normalized.replace(/\s+/g, '')
  }
  return normalized
}
