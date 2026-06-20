// pages/result/result.js - 结果批改页
const { saveUserLog } = require('../../utils/cloudApi.js')
const { MODES, SUBJECTS, PROMPT_TYPES, ANSWER_TYPES } = require('../../utils/constants.js')
const { toast } = require('../../utils/ui.js')

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
    mode: MODES.EN2CN,
    subject: SUBJECTS.ENGLISH,
    interval: 5,
    wordCountRange: { min: 10, max: 15 }
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
        mode: data.mode || MODES.EN2CN,
        subject: data.subject || SUBJECTS.ENGLISH,
        interval: data.interval || 5,
        wordCountRange: data.wordCountRange || { min: data.total || 10, max: data.total || 15 }
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
    if (this.data.saved) return
    const { wordCountRange } = this.data
    try {
      const res = await saveUserLog({
        unitIds: data.unitIds || [],
        subject: data.subject || SUBJECTS.ENGLISH,
        mode: data.mode || MODES.EN2CN,
        wordCountRange: {
          min: Number(wordCountRange.min) || 0,
          max: Number(wordCountRange.max) || 0
        },
        totalWords: data.total || 0,
        correctCount: data.correctCount || 0,
        wrongCount: data.wrongCount || 0,
        accuracy: data.accuracy || 0,
        wrongWords: data.wrongWords || [],
        questions: data.questions || [],
        status: 'completed'
      })
      if (res.code !== 0) {
        console.error('保存听写记录失败:', res.message)
        toast('成绩记录未保存，可继续查看')
        return
      }
      this.setData({ saved: true })
    } catch (err) {
      console.error('保存听写记录失败:', err)
      // 记录保存失败不影响用户查看结果，但需提示用户
      wx.showToast({ title: '成绩记录未保存，可继续查看', icon: 'none', duration: 2500 })
    }
  },

  // 重测错题：保留原始 mode / subject / interval，避免配置丢失
  onRetryWrong() {
    if (this.data.wrongWords.length === 0) {
      toast('没有错题，棒极了！')
      return
    }
    const { mode, subject, unitIds, interval } = this.data
    wx.navigateTo({
      url: `/pages/dictation/dictation?mode=${encodeURIComponent(mode)}&subject=${encodeURIComponent(subject)}&interval=${interval}`,
      success: (nav) => {
        nav.eventChannel.emit('dictationData', {
          questions: this.data.wrongWords.map((w, i) => ({
            index: i + 1,
            wordId: w.wordId,
            unitId: '',
            audioUrl: w.audioUrl || '',
            prompt: w.word,
            promptType: w.promptType || PROMPT_TYPES.ENGLISH,
            answer: w.correctAnswer,
            answerType: w.answerType || ANSWER_TYPES.CHINESE
          })),
          total: this.data.wrongWords.length,
          unitIds: unitIds || [],
          mode,
          subject
        })
      },
      fail: (err) => {
        console.error('跳转听写页失败:', err)
        wx.showToast({ title: '页面跳转失败，请重试', icon: 'none' })
      }
    })
  },

  // 再测一组：同配置重新抽题，携带学科和模式减少重复选择
  onRetryAll() {
    const { subject, mode } = this.data
    wx.reLaunch({ url: `/pages/index/index?subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(mode)}` })
  },

  onBackHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
