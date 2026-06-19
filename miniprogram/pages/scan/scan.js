// pages/scan/scan.js - 拍照识字导入页
const { parseOcrImage } = require('../../utils/aiClient.js')

Page({
  data: {
    subject: 'english',
    unitId: '',
    loading: false,
    status: '',
    resultWords: [],
    count: 0,
    demo: false
  },

  onLoad(options) {
    const { subject, unitId } = options
    if (!unitId) {
      wx.showToast({ title: '缺少单元信息', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({
      subject: subject || 'english',
      unitId
    })
  },

  // 选择照片或拍照
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadAndParse(tempFilePath)
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
      }
    })
  },

  // 上传图片到云存储并调用 parseOcr 云函数
  async uploadAndParse(tempFilePath) {
    const { subject, unitId } = this.data
    this.setData({ loading: true, status: '正在上传图片...', resultWords: [] })

    try {
      const cloudPath = `ocr/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })

      this.setData({ status: '正在识别文字，请稍候...' })
      const parseRes = await parseOcrImage(uploadRes.fileID, { subject, unitId })

      if (parseRes.code !== 0) {
        wx.showToast({ title: parseRes.message || '识别失败', icon: 'none' })
        this.setData({ loading: false, status: parseRes.message || '识别失败' })
        return
      }

      const words = parseRes.data.words || []
      this.setData({
        loading: false,
        status: `识别完成，本次导入 ${words.length} 个单词`,
        resultWords: words,
        count: words.length,
        demo: parseRes.data.demo || false
      })

      wx.showToast({
        title: parseRes.data.demo ? '演示数据，未写入数据库' : `成功导入 ${words.length} 个`,
        icon: 'none'
      })
    } catch (err) {
      console.error('上传/识别失败:', err)
      wx.showToast({ title: '上传或识别失败', icon: 'none' })
      this.setData({ loading: false, status: '上传或识别失败，请重试' })
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onGoHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
