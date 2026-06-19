// pages/dictation/dictation.js - 听写进行页（核心）
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
    isPlaying: false
  },

  onLoad(options) {
    const { mode, interval, subject } = options
    this.setData({
      mode: mode || 'en2cn',
      interval: Number(interval) || 5,
      subject: subject || 'english'
    })

    // 接收首页传递的题目数据
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('dictationData', (data) => {
      this.setData({
        questions: data.questions,
        total: data.total,
        unitIds: data.unitIds
      })
      // 首题自动播报
      this.playCurrent()
    })
  },

  // 播报当前题
  playCurrent() {
    const { questions, currentIndex } = this.data
    if (!questions[currentIndex]) return
    const prompt = questions[currentIndex].prompt
    // 使用微信 TTS（同声传译插件或内置）
    this.speak(prompt)
  },

  // 语音合成
  speak(text) {
    // 优先使用 backgroundAudioManager 播放标准发音
    const audioMgr = wx.getBackgroundAudioManager()
    audioMgr.title = text
    audioMgr.src = `https://tts.example.com/speak?text=${encodeURIComponent(text)}`
    this.setData({ isPlaying: true })
    audioMgr.onEnded(() => {
      this.setData({ isPlaying: false })
    })
    audioMgr.onError(() => {
      this.setData({ isPlaying: false })
    })
  },

  // 手动重播
  onReplay() {
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

    answers.push({
      wordId: current.wordId,
      word: current.prompt,
      correctAnswer: current.answer,
      userAnswer: userInput.trim(),
      isCorrect: userInput.trim() === current.answer
    })

    this.setData({ answers, userInput: '' })

    if (currentIndex + 1 < questions.length) {
      this.setData({ currentIndex: currentIndex + 1 })
      this.playCurrent()
    } else {
      // 听写结束，跳转结果页
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

    wx.redirectTo({
      url: '/pages/result/result',
      success: (nav) => {
        nav.eventChannel.emit('resultData', {
          answers, unitIds, mode, subject,
          total, correctCount, wrongCount, accuracy
        })
      }
    })
  }
})
