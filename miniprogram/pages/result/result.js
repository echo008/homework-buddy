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
    saved: false,
    unitIds: [],
    mode: 'en2cn',
    subject: 'english'
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel()
    if (!eventChannel || !eventChannel.on) {
      wx.showToast({ title: '数据加载异常', icon: 'none' })
      return
    }
    eventChannel.on('resultData', (data) => {
      const wrongWords = (data.answers || []).filter(a => !a.isCorrect)
      this.setData({
        answers: data.answers || [],
        total: data.total || 0,
        correctCount: data.correctCount || 0,
        wrongCount: data.wrongCount || 0,
        accuracy: data.accuracy || 0,
        wrongWords,
        unitIds: data.unitIds || [],
        mode: data.mode || 'en2cn',
        subject: data.subject || 'english'
      })
      this.saveLog({ ...data, wrongWords })
    })
  },

  onShareAppMessage() {
    const { accuracy, total, correctCount } = this.data
    return {
      title: `我在智听听写中得了 ${accuracy} 分，答对 ${correctCount}/${total} 题，快来一起挑战吧！`,
      path: '/pages/index/index'
    }
  },

  async saveLog(data) {
    try {
      const app = getApp()
      const openid = app.globalData.openid || ''
      await saveUserLog({
        openid,
        unitIds: data.unitIds || [],
        subject: data.subject || 'english',
        mode: data.mode || 'en2cn',
        wordCountRange: { min: data.total || 0, max: data.total || 0 },
        totalWords: data.total || 0,
        correctCount: data.correctCount || 0,
        wrongCount: data.wrongCount || 0,
        accuracy: data.accuracy || 0,
        wrongWords: data.wrongWords || [],
        status: 'completed'
      })
      this.setData({ saved: true })
    } catch (err) {
      console.error('保存听写记录失败:', err)
    }
  },

  // 重测错题：保留原始 audioUrl
  onRetryWrong() {
    if (this.data.wrongWords.length === 0) {
      wx.showToast({ title: '没有错题，棒极了！', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/dictation/dictation?mode=retry',
      success: (nav) => {
        nav.eventChannel.emit('dictationData', {
          questions: this.data.wrongWords.map((w, i) => ({
            index: i + 1,
            wordId: w.wordId,
            unitId: '',
            audioUrl: w.audioUrl || '',
            prompt: w.word,
            promptType: w.promptType || 'english',
            answer: w.correctAnswer,
            answerType: w.answerType || 'chinese'
          })),
          total: this.data.wrongWords.length,
          unitIds: this.data.unitIds || []
        })
      }
    })
  },

  // 再测一组：同配置重新抽题
  onRetryAll() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  onBackHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
