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

  /**
   * 获取 openid，带最多 3 次重试
   * @param {number} retryCount 当前重试次数
   */
  fetchOpenid(retryCount = 0) {
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        if (res.result && res.result.code === 0 && res.result.data && res.result.data.openid) {
          this.globalData.openid = res.result.data.openid
          console.log('openid 获取成功')
        } else if (retryCount < 3) {
          // 业务错误也重试
          setTimeout(() => this.fetchOpenid(retryCount + 1), 1000 * (retryCount + 1))
        }
      },
      fail: (err) => {
        console.error('获取 openid 失败:', err)
        if (retryCount < 3) {
          // 网络错误重试，间隔递增（1s/2s/3s）
          setTimeout(() => this.fetchOpenid(retryCount + 1), 1000 * (retryCount + 1))
        }
      }
    })
  },

  /**
   * 确保 openid 已就绪（供页面调用）
   * 若 openid 已存在直接返回；否则触发获取并等待
   * @returns {Promise<string>}
   */
  ensureOpenid() {
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid)
    }
    return new Promise((resolve, reject) => {
      let attempts = 0
      const timer = setInterval(() => {
        attempts += 1
        if (this.globalData.openid) {
          clearInterval(timer)
          resolve(this.globalData.openid)
        } else if (attempts > 10) {
          // 超过 5 秒仍未获取到
          clearInterval(timer)
          reject(new Error('openid 获取超时'))
        }
      }, 500)
      // 同时触发一次获取
      this.fetchOpenid()
    })
  },

  globalData: {
    userInfo: null,
    openid: null
  }
})
