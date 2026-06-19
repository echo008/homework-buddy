// app.js - 智听 · Homework Buddy 小程序入口
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      // env 说明：请替换为你的真实云开发环境 ID；若只有一个环境可删除 env 字段使用默认环境
      env: 'your-cloud-env-id',
      traceUser: true
    })

    // 获取用户 OPENID，用于听写记录归属
    this.fetchOpenid()
  },

  fetchOpenid() {
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        if (res.result && res.result.code === 0) {
          this.globalData.openid = res.result.data.openid
          console.log('openid 获取成功')
        }
      },
      fail: (err) => {
        console.error('获取 openid 失败:', err)
      }
    })
  },

  globalData: {
    userInfo: null,
    openid: null
  }
})
