// pages/dictation/dictation.js - 听写进行页（核心）
const { speak, stop: stopTTS, resolveLang } = require('../../utils/tts.js')

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
    ttsUnavailable: false,
    submitting: false // 防快速点击
  },

  countdownTimer: null,
  dataTimeout: null,
  currentAudio: null, // 当前正在播放的自定义音频上下文
  isHidden: false, // 页面是否在后台

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
    // 退出页面时销毁所有音频（自定义 + TTS），避免后台继续播放
    this.destroyCurrentAudio()
  },

  // 页面切到后台：暂停倒计时与音频，避免状态错乱
  onHide() {
    this.isHidden = true
    this.clearCountdown()
    this.destroyCurrentAudio()
    this.setData({ isPlaying: false, countdown: 0 })
  },

  // 页面回到前台：若未在退出确认弹窗中，重新播报当前题
  onShow() {
    if (this.isHidden && this.data.dataReady && !this.data.showExitConfirm) {
      this.isHidden = false
      // 回前台后重新播报当前题，恢复听写节奏
      this.playCurrent()
    } else if (this.isHidden) {
      this.isHidden = false
    }
  },

  // 销毁当前正在播放的音频（自定义音频 + TTS）
  destroyCurrentAudio() {
    // 停止自定义录音
    if (this.currentAudio) {
      try {
        this.currentAudio.stop()
      } catch (e) {}
      try {
        this.currentAudio.destroy()
      } catch (e) {}
      this.currentAudio = null
    }
    // 停止 TTS
    stopTTS()
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

  // 播报当前题：优先使用自定义录音，否则用 TTS；拼音模式仅显示文字
  playCurrent() {
    const { questions, currentIndex } = this.data
    const current = questions[currentIndex]
    if (!current) return

    // 切换播放前先销毁上一个音频，避免叠加
    this.destroyCurrentAudio()
    this.setData({ ttsUnavailable: false })

    if (current.audioUrl) {
      this.setData({ isPlaying: true })
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
    } else if (current.promptType === 'pinyin') {
      // 拼音模式：TTS 无法准确读出带声调拼音，仅显示文字，不播报
      this.setData({ isPlaying: false })
    } else {
      this.setData({ isPlaying: true })
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
    // 防快速点击：提交中直接忽略
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const { questions, currentIndex, userInput, answers } = this.data
    const current = questions[currentIndex]
    if (!current) {
      this.setData({ submitting: false })
      return
    }

    // 进入下一题前停止当前音频播放，避免叠加
    this.destroyCurrentAudio()
    this.clearCountdown()

    const isCorrect = checkAnswer(userInput, current.answer, current.answerType)

    const newAnswers = [...answers, {
      wordId: current.wordId,
      word: current.prompt,
      promptType: current.promptType,
      answerType: current.answerType,
      correctAnswer: current.answer,
      userAnswer: userInput.trim(),
      audioUrl: current.audioUrl || '',
      isCorrect
    }]

    this.setData({ answers: newAnswers, userInput: '' })

    if (currentIndex + 1 < questions.length) {
      const nextIndex = currentIndex + 1
      this.setData({ currentIndex: nextIndex, submitting: false })
      this.updateAudioFlag()
      this.startCountdown()
    } else {
      // finish 内部会跳转，无需重置 submitting
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
      },
      fail: (err) => {
        console.error('跳转结果页失败:', err)
        // 页面栈满或其他原因导致跳转失败，重置状态并提示
        this.setData({ submitting: false })
        wx.showToast({ title: '提交失败，请重试', icon: 'none' })
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

/**
 * 答案比对：支持分号/逗号分隔的多义答案，任一匹配即算正确
 * @param {string} userInput 用户输入
 * @param {string} correctAnswer 标准答案（可能含 ; ；, ， 分隔的多义）
 * @param {string} answerType english | chinese | pinyin
 * @returns {boolean}
 */
function checkAnswer(userInput, correctAnswer, answerType) {
  if (!userInput || !correctAnswer) return false

  const userNorm = normalizeAnswer(userInput, answerType)
  if (!userNorm) return false

  // 标准答案按分号/逗号拆分为多个可接受答案
  const acceptableList = String(correctAnswer)
    .split(/[;；,，、]/)
    .map(s => normalizeAnswer(s, answerType))
    .filter(s => s.length > 0)

  return acceptableList.some(acceptable => acceptable === userNorm)
}

function normalizeAnswer(value, answerType) {
  if (!value) return ''
  let normalized = String(value).trim()
  if (answerType === 'english') {
    normalized = normalized.toLowerCase().replace(/\s+/g, '')
  } else if (answerType === 'chinese' || answerType === 'pinyin') {
    normalized = normalized.replace(/\s+/g, '')
  }
  return normalized
}
