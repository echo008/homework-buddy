// cloudfunctions/login/index.js
// 获取当前用户 OPENID 与登录凭证

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  return {
    code: 0,
    message: 'success',
    data: {
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    }
  }
}
