// pages/scan/scan.js - 拍照/上传页（占位，第二阶段实现 OCR 导入）
Page({
  data: {},
  onLoad() {},
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        wx.showToast({ title: 'OCR 导入功能开发中', icon: 'none' })
      }
    })
  }
})
