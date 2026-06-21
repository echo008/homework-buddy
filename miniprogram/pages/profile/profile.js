// pages/profile/profile.js - 我的/词库管理
const { getUserLogs } = require('../../utils/cloudApi.js')
const { SUBJECTS, MODE_LABELS, SUBJECT_LABELS, PROMPT_TYPES, ANSWER_TYPES } = require('../../utils/constants.js')
const { toast } = require('../../utils/ui.js')

function enrichLog(log) {
  const tagClass = log.subject === SUBJECTS.ENGLISH ? 'tag-primary' : 'tag-accent'
  return {
    ...log,
    subjectLabel: SUBJECT_LABELS[log.subject] || log.subject,
    modeLabel: MODE_LABELS[log.mode] || log.mode,
    tagClass
  }
}

// 时间格式化：ISO/Date → 友好显示（如 "2026-06-19 14:30"）
function formatTime(input) {
  if (!input) return ''
  let d
  if (typeof input === 'object' && input instanceof Date) {
    d = input
  } else if (typeof input === 'object' && input.$date) {
    d = new Date(input.$date)
  } else {
    d = new Date(input)
  }
  if (isNaN(d.getTime())) return ''
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

Page({
  data: {
    logs: [],
    stats: {
      totalTests: 0,
      totalWords: 0,
      avgAccuracy: 0
    },
    loading: true,
    showLogDetail: false,
    currentLog: null
  },

  onShow() {
    this.loadLogs()
  },

  onPullDownRefresh() {
    this.loadLogs().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  async loadLogs() {
    try {
      const res = await getUserLogs(50)
      const logs = (res && res.code === 0) ? (res.data || []) : []
      // 时间格式化，避免直接显示 ISO 字符串
      const formatted = logs.map((log) => enrichLog({
        ...log,
        createdAtText: formatTime(log.createdAt)
      }))
      const stats = this.computeStats(formatted)
      this.setData({ logs: formatted, stats, loading: false })
    } catch (err) {
      this.setData({ loading: false })
      toast('记录加载失败')
    }
  },

  computeStats(logs) {
    const totalTests = logs.length
    const totalWords = logs.reduce((sum, log) => sum + (Number(log.totalWords) || 0), 0)
    // accuracy 可能从数据库读出为字符串，统一转 Number
    const avgAccuracy = totalTests > 0
      ? Math.round(logs.reduce((sum, log) => sum + (Number(log.accuracy) || 0), 0) / totalTests * 10) / 10
      : 0
    return { totalTests, totalWords, avgAccuracy }
  },

  goUnits() {
    wx.navigateTo({ url: '/pages/units/units' })
  },

  goClass() {
    wx.navigateTo({ url: '/pages/class/class' })
  },

  onShareAppMessage() {
    return {
      title: 'Homework Buddy · 智听 - 让听写变简单',
      path: '/pages/index/index'
    }
  },

  // 打开历史记录详情
  onLogTap(e) {
    const log = e.currentTarget.dataset.log
    if (!log) return
    this.setData({ showLogDetail: true, currentLog: log })
  },

  // 关闭详情弹窗
  onCloseLogDetail() {
    this.setData({ showLogDetail: false, currentLog: null })
  },

  // 阻止冒泡的空方法
  noop() {},

  // 重测本次听写的全部题目
  onRetryLog() {
    const { currentLog } = this.data
    if (!currentLog) return
    const questions = currentLog.questions || []
    if (questions.length === 0) {
      toast('该记录没有保存题目')
      return
    }
    const wordCountRange = currentLog.wordCountRange || { min: questions.length, max: questions.length }
    this.setData({ showLogDetail: false })
    wx.navigateTo({
      url: `/pages/dictation/dictation?mode=${encodeURIComponent(currentLog.mode)}&subject=${encodeURIComponent(currentLog.subject)}&interval=5&min=${wordCountRange.min}&max=${wordCountRange.max}`,
      success: (res) => {
        res.eventChannel.emit('dictationData', {
          questions,
          total: questions.length,
          unitIds: [],
          source: 'log',
          wordCountRange
        })
      }
    })
  },

  // 重测本次错题
  onRetryWrongLog() {
    const { currentLog } = this.data
    if (!currentLog) return
    const wrongWords = currentLog.wrongWords || []
    if (wrongWords.length === 0) {
      toast('本次没有错题')
      return
    }
    const questions = wrongWords.map((w, i) => rebuildQuestionFromAnswer(w, i + 1, currentLog.mode))
    const wordCountRange = currentLog.wordCountRange || { min: questions.length, max: questions.length }
    this.setData({ showLogDetail: false })
    wx.navigateTo({
      url: `/pages/dictation/dictation?mode=${encodeURIComponent(currentLog.mode)}&subject=${encodeURIComponent(currentLog.subject)}&interval=5&min=${wordCountRange.min}&max=${wordCountRange.max}`,
      success: (res) => {
        res.eventChannel.emit('dictationData', {
          questions,
          total: questions.length,
          unitIds: [],
          source: 'log',
          wordCountRange
        })
      }
    })
  }
})

/**
 * 将错题记录还原为 dictation 页可用的题目对象（与 result.js 保持一致）。
 * @param {Object} w 错题记录
 * @param {number} index 新序号
 * @param {string} fallbackMode 当旧数据没有 mode 时的回退
 * @returns {Object}
 */
function rebuildQuestionFromAnswer(w, index, fallbackMode) {
  const mode = w.mode || fallbackMode
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
