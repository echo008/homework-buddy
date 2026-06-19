// pages/profile/profile.js - 我的/词库管理
const { getUserLogs } = require('../../utils/db.js')

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

  async loadLogs() {
    try {
      const app = getApp()
      const openid = app.globalData.openid || ''
      if (!openid) {
        this.setData({ loading: false })
        return
      }
      const logs = await getUserLogs(openid, 50)
      const stats = this.computeStats(logs)
      this.setData({ logs, stats, loading: false })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: '记录加载失败', icon: 'none' })
    }
  },

  computeStats(logs) {
    const totalTests = logs.length
    const totalWords = logs.reduce((sum, log) => sum + (log.totalWords || 0), 0)
    const avgAccuracy = totalTests > 0
      ? Math.round(logs.reduce((sum, log) => sum + (log.accuracy || 0), 0) / totalTests * 10) / 10
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
