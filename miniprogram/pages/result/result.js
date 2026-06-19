// pages/result/result.js - 结果批改页
const { saveUserLog } = require('../../utils/db.js')

Page({
  data: {
    answers: [],
    total: 0,
    correctCount: 0,
    wrongCount: 0,
    accuracy: 0,
    wrongWords: [],
    saved: false
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('resultData', (data) => {
      const wrongWords = data.answers.filter(a => !a.isCorrect)
      this.setData({
        answers: data.answers,
        total: data.total,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
        accuracy: data.accuracy,
        wrongWords
      })
      this.saveLog(data)
    })
  },

  // 保存听写记录
  async saveLog(data) {
    try {
      const app = getApp()
      await saveUserLog({
        openid: app.globalData.openid || '',
        unitIds: data.unitIds,
        subject: data.subject,
        mode: data.mode,
        wordCountRange: { min: data.total, max: data.total },
        totalWords: data.total,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
        accuracy: data.accuracy,
        wrongWords: data.wrongWords,
        status: 'completed'
      })
      this.setData({ saved: true })
    } catch (err) {
      console.error('保存听写记录失败:', err)
    }
  },

  // 一键重测错题
  onRetryWrong() {
    if (this.data.wrongWords.length === 0) {
      wx.showToast({ title: '没有错题，棒极了！', icon: 'none' })
      return
    }
    wx.redirectTo({
      url: '/pages/dictation/dictation?mode=retry',
      success: (nav) => {
        nav.eventChannel.emit('dictationData', {
          questions: this.data.wrongWords.map((w, i) => ({
            index: i + 1,
            wordId: w.wordId,
            prompt: w.word,
            answer: w.correctAnswer
          })),
          total: this.data.wrongWords.length
        })
      }
    })
  },

  onBackHome() {
    wx.navigateBack({ delta: 10 })
  }
})
