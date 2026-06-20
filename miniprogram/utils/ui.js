// utils/ui.js - 通用 UI 交互封装，避免各页面重复写 wx.showToast/Loading

/**
 * 显示轻提示
 * @param {string} title
 * @param {string} icon
 */
function toast(title, icon = 'none') {
  wx.showToast({ title, icon })
}

/**
 * 显示加载中（默认带 mask，防止重复点击）
 * @param {string} title
 */
function loading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

/**
 * 隐藏加载
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 确认弹窗
 * @param {string} title
 * @param {string} content
 * @param {Object} options
 */
function modal(title, content, options = {}) {
  return wx.showModal({
    title,
    content,
    ...options
  })
}

module.exports = {
  toast,
  loading,
  hideLoading,
  modal
}
