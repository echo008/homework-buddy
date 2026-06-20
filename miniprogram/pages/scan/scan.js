// pages/scan/scan.js - 拍照识字导入页
const { parseOcrImage } = require('../../utils/cloudApi.js')
const { SUBJECTS } = require('../../utils/constants.js')
const { toast, modal } = require('../../utils/ui.js')

Page({
  data: {
    subject: SUBJECTS.ENGLISH,
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
      toast('缺少单元信息')
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({
      subject: subject || SUBJECTS.ENGLISH,
      unitId
    })
  },

  // 选择照片或拍照（优先 chooseMedia，低版本基础库降级到 chooseImage）
  onChooseImage() {
    const handleSuccess = (tempFilePath) => {
      this.uploadAndParse(tempFilePath)
    }

    const handleFail = (err) => {
      console.error('选择图片失败:', err)
      const errMsg = err && err.errMsg ? err.errMsg : ''
      // 权限错误时才引导设置（兼容多种错误文案）
      if (/auth deny|authorize|permission denied/i.test(errMsg)) {
        modal('需要权限', '需要相机和相册权限才能拍照识字，请在设置中开启', {
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) wx.openSetting()
          }
        })
      }
    }

    if (wx.canIUse('chooseMedia')) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath
          if (tempFilePath) handleSuccess(tempFilePath)
        },
        fail: handleFail
      })
    } else {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths && res.tempFilePaths[0]
          if (tempFilePath) handleSuccess(tempFilePath)
        },
        fail: handleFail
      })
    }
  },

  // 上传图片到云存储并调用 parseOcr 云函数
  async uploadAndParse(tempFilePath) {
    const { subject, unitId } = this.data
    this.setData({ loading: true, status: '正在上传图片...', resultWords: [] })

    try {
      // 优先压缩图片，提升上传速度并降低流量消耗
      let filePath = tempFilePath
      if (wx.canIUse('compressImage')) {
        try {
          const compressRes = await wx.compressImage({ src: tempFilePath, quality: 80 })
          filePath = compressRes.tempFilePath
        } catch (err) {
          console.error('图片压缩失败:', err)
        }
      }

      const cloudPath = `ocr/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })

      this.setData({ status: '正在识别文字，请稍候...' })
      const parseRes = await parseOcrImage(uploadRes.fileID, { subject, unitId })

      if (parseRes.code !== 0) {
        toast(parseRes.message || '识别失败')
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

      toast(parseRes.data.demo ? '演示数据，未写入数据库' : `成功导入 ${words.length} 个`)
    } catch (err) {
      console.error('上传/识别失败:', err)
      toast('上传或识别失败')
      this.setData({ loading: false, status: '上传或识别失败，请重试' })
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onGoHome() {
    const { subject } = this.data
    wx.reLaunch({ url: `/pages/index/index?subject=${encodeURIComponent(subject)}` })
  }
})
