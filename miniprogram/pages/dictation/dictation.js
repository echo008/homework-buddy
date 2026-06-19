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
    unitIds: []
  },

  timer: null,

  onLoad(options) {
    const { mode, interval, subject } = options
    this.setData({
      mode: mode || 'en2cn',
      interval: Number(interval) || 5,
      subject: subject || 'english'
    })

    // 接收首页传递的题目数据
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel && eventChannel.on) {
      eventChannel.on('dictationData', (data) => {
        this.setData({
          questions: data.questions || [],
          total: data.total || 0,
          unitIds: data.unitIds || []
        })
        // 首题自动播报
        this.playCurrent()
      })
    }
  },

  onUnload() {
    this.clearTimer()
  },

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  },

  // 播报当前题
  playCurrent() {
    const { questions, currentIndex } = this.data
    const current = questions[currentIndex]
    if (!current) return

    const lang = resolveLang(current.promptType, this.data.subject)
    this.setData({ isPlaying: true })

    speak(current.prompt, lang, {
      onStart: () => this.setData({ isPlaying: true }),
      onEnd: () => this.setData({ isPlaying: false }),
      onError: (err) => {
        this.setData({ isPlaying: false })
        console.error('播报失败:', err)
      }
    })
  },

  // 手动重播
  onReplay() {
    this.clearTimer()
    this.playCurrent()
  },

  // 输入
  onInput(e) {
    this.setData({ userInput: e.detail.value })
  },

  // 下一题
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
      // 按配置间隔自动播报下一题
      const { interval } = this.data
      this.clearTimer()
      this.timer = setTimeout(() => {
        this.playCurrent()
      }, interval * 1000)
    } else {
      this.finish()
    }
  },

  // 完成听写
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
