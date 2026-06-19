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
    hasCustomAudio: false,
    dataReady: false,
    showExitConfirm: false,
    ttsUnavailable: false
  },

  countdownTimer: null,
  dataTimeout: null,
  currentAudio: null, // 当前正在播放的音频上下文，切题/退出时统一销毁

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
        if (this.dataTimeout) {
          clearTimeout(this.dataTimeout)
          this.dataTimeout = null
        }
        const questions = data.questions || []
        if (questions.length === 0) {
          wx.showToast({ title: '没有题目数据', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }
        this.setData({
          questions,
          total: data.total || questions.length,
          unitIds: data.unitIds || [],
          currentIndex: 0,
          userInput: '',
          answers: [],
          dataReady: true
        })
        this.updateAudioFlag()
        this.playCurrent()
      })

      // 超时保护：3 秒内未收到数据则提示并返回
      this.dataTimeout = setTimeout(() => {
        if (!this.data.dataReady) {
          wx.showToast({ title: '数据加载超时，请重试', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      }, 3000)
    } else {
      // 无 eventChannel（如直接进入页面），提示并返回
      wx.showToast({ title: '请从首页开始听写', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onUnload() {
    this.clearCountdown()
    if (this.dataTimeout) {
      clearTimeout(this.dataTimeout)
      this.dataTimeout = null
    }
    // 退出页面时销毁当前音频，避免后台继续播放
    this.destroyCurrentAudio()
  },

  // 销毁当前正在播放的音频上下文
  destroyCurrentAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.stop()
      } catch (e) {}
      try {
        this.currentAudio.destroy()
      } catch (e) {}
      this.currentAudio = null
    }
  },

  // 退出确认
  onBack() {
    this.setData({ showExitConfirm: true })
  },

  onExitCancel() {
    this.setData({ showExitConfirm: false })
  },

  onExitConfirm() {
    this.setData({ showExitConfirm: false })
    wx.navigateBack()
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

    // 切换播放前先销毁上一个音频，避免叠加
    this.destroyCurrentAudio()
    this.setData({ isPlaying: true, ttsUnavailable: false })

    if (current.audioUrl) {
      this.currentAudio = playCustomAudio(current.audioUrl, {
        onEnd: () => {
          this.setData({ isPlaying: false })
          this.currentAudio = null
        },
        onError: () => {
          this.setData({ isPlaying: false })
          this.currentAudio = null
          // 录音播放失败时降级到 TTS
          this.playTTS(current)
        }
      })
    } else {
      this.playTTS(current)
    }
  },

  playTTS(current) {
    const lang = resolveLang(current.promptType, this.data.subject)
    speak(current.prompt, lang, {
      onStart: () => this.setData({ isPlaying: true }),
      onEnd: () => this.setData({ isPlaying: false }),
      onError: () => this.setData({ isPlaying: false, ttsUnavailable: true })
    })
  },

  onReplay() {
    this.clearCountdown()
    this.playCurrent()
  },

  onInput(e) {
    this.setData({ userInput: e.detail.value })
  },

  // 跳过当前题（算作答错）
  onSkip() {
    this.setData({ userInput: '' })
    this.onNext()
  },

  onNext() {
    const { questions, currentIndex, userInput, answers } = this.data
    const current = questions[currentIndex]
    if (!current) return

    // 进入下一题前停止当前音频播放，避免叠加
    this.destroyCurrentAudio()
    this.clearCountdown()

    const normalizedUser = normalizeAnswer(userInput.trim(), current.answerType)
    const normalizedCorrect = normalizeAnswer(current.answer, current.answerType)

    const newAnswers = [...answers, {
      wordId: current.wordId,
      word: current.prompt,
      promptType: current.promptType,
      answerType: current.answerType,
      correctAnswer: current.answer,
      userAnswer: userInput.trim(),
      audioUrl: current.audioUrl || '',
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
    // 完成时清理音频与倒计时
    this.destroyCurrentAudio()
    this.clearCountdown()

    const { answers, unitIds, mode, subject } = this.data
    const correctCount = answers.filter(a => a.isCorrect).length
    const total = answers.length
    const wrongCount = total - correctCount
    const accuracy = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0
    const wrongWords = answers.filter(a => !a.isCorrect)

    wx.navigateTo({
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
  // 返回上下文引用，便于外部统一销毁
  return innerAudioContext
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
