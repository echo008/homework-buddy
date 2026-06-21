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
      toast('数据加载异常')
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
      toast('成绩记录未保存，可继续查看')
    }
  },

  // 重测错题：保留原始 mode / subject / interval / wordCountRange，避免配置丢失
  onRetryWrong() {
    if (this.data.wrongWords.length === 0) {
      toast('没有错题，棒极了！')
      return
    }
    const { mode, subject, unitIds, interval, wordCountRange } = this.data
    const min = wordCountRange.min || this.data.wrongWords.length
    const max = wordCountRange.max || this.data.wrongWords.length
    wx.navigateTo({
      url: `/pages/dictation/dictation?mode=${encodeURIComponent(mode)}&subject=${encodeURIComponent(subject)}&interval=${interval}&min=${min}&max=${max}`,
      success: (nav) => {
        nav.eventChannel.emit('dictationData', {
          questions: this.data.wrongWords.map((w, i) => rebuildQuestionFromAnswer(w, i + 1, mode)),
          total: this.data.wrongWords.length,
          unitIds: unitIds || [],
          mode,
          subject,
          wordCountRange
        })
      },
      fail: (err) => {
        console.error('跳转听写页失败:', err)
        toast('页面跳转失败，请重试')
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

/**
 * 将错题记录还原为 dictation 页可用的题目对象。
 * 兼容新结构（保存了 prompt/answer/word/meaning/pinyin）与旧结构（仅 word/promptType/answerType/correctAnswer）。
 * @param {Object} w 错题记录
 * @param {number} index 新序号
 * @param {string} fallbackMode 当旧数据没有 mode 时的回退
 * @returns {Object}
 */
function rebuildQuestionFromAnswer(w, index, fallbackMode) {
  const mode = w.mode || fallbackMode
  // 新结构：已经完整保存了 prompt / answer / 原始词信息
  if (w.prompt !== undefined && w.answer !== undefined) {
    return {
      index,
      wordId: w.wordId,
      unitId: w.unitId || '',
      word: w.word,
      meaning: w.meaning || '',
      pinyin: w.pinyin || '',
      subject: w.subject,
      audioUrl: w.audioUrl || '',
      mode,
      prompt: w.prompt,
      promptType: w.promptType,
      answer: w.answer,
      answerType: w.answerType
    }
  }

  // 旧结构兼容：word 字段实际存储的是 prompt
  return {
    index,
    wordId: w.wordId,
    unitId: '',
    word: w.word,
    meaning: '',
    pinyin: '',
    subject: '',
    audioUrl: w.audioUrl || '',
    mode,
    prompt: w.word,
    promptType: w.promptType || PROMPT_TYPES.ENGLISH,
    answer: w.correctAnswer,
    answerType: w.answerType || ANSWER_TYPES.CHINESE
  }
}
