// pages/profile/profile.js - 我的/词库管理
const { getUserLogs } = require('../../utils/db.js')

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
    loading: true
  },

  onShow() {
    this.loadLogs()
  },

  onPullDownRefresh() {
    this.loadLogs().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  async loadLogs() {
    try {
      const app = getApp()
      // 等待 openid 就绪，避免首次启动时 openid 为 null 导致记录加载失败
      let openid = app.globalData.openid || ''
      if (!openid) {
        try {
          openid = await app.ensureOpenid()
        } catch (err) {
          this.setData({ loading: false })
          wx.showToast({ title: '用户信息获取失败', icon: 'none' })
          return
        }
      }
      const logs = await getUserLogs(openid, 50)
      // 时间格式化，避免直接显示 ISO 字符串
      const formatted = (logs || []).map((log) => ({
        ...log,
        createdAtText: formatTime(log.createdAt)
      }))
      const stats = this.computeStats(formatted)
      this.setData({ logs: formatted, stats, loading: false })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: '记录加载失败', icon: 'none' })
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
  }
})
