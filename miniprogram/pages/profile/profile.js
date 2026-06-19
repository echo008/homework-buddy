// pages/profile/profile.js - 我的/词库管理
const { getUserLogs } = require('../../utils/db.js')

Page({
  data: {
    logs: [],
    loading: true
  },

  onShow() {
    this.loadLogs()
  },

  async loadLogs() {
    try {
      const app = getApp()
      const openid = app.globalData.openid || ''
      if (!openid) return
      const logs = await getUserLogs(openid, 20)
      this.setData({ logs, loading: false })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({ title: '记录加载失败', icon: 'none' })
    }
  }
})
