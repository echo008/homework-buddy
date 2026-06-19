// app.js - 智听 Smart Dictation Helper 小程序入口
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      // env 说明：请填写你的云开发环境 ID
      env: 'smart-dictation-prod',
      traceUser: true
    })
  },

  globalData: {
    userInfo: null,
    openid: null
  }
})
