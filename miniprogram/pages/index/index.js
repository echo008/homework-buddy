// pages/index/index.js - 首页：听写配置
const { getUnits } = require('../../utils/db.js')
const { getDictationList } = require('../../utils/aiClient.js')

Page({
  data: {
    // 学科切换
    subject: 'english',
    subjectTabs: [
      { key: 'english', label: '英语' },
      { key: 'chinese', label: '语文' }
    ],

    // 单元列表
    units: [],
    selectedUnitIds: [],

    // 听写模式
    mode: 'en2cn',
    modeOptions: {
      english: [
        { value: 'en2cn', label: '英文→中文' },
        { value: 'cn2en', label: '中文→英文' }
      ],
      chinese: [
        { value: 'pinyin2hanzi', label: '看拼音→写汉字' }
      ]
    },

    // 数量区间（Min-Max）
    wordCountRange: { min: 10, max: 15 },
    countMin: 10,
    countMax: 15,

    // 间隔时间（秒）
    interval: 5,

    submitting: false
  },

  onLoad() {
    this.loadUnits('english')
  },

  onShow() {
    // 每次展示时刷新单元词数
    if (this.data.units.length > 0) {
      this.loadUnits(this.data.subject)
    }
  },

  // 切换学科
  onSubjectChange(e) {
    const subject = e.currentTarget.dataset.key
    const modes = this.data.modeOptions[subject]
    this.setData({
      subject,
      selectedUnitIds: [],
      mode: modes[0].value
    })
    this.loadUnits(subject)
  },

  // 加载单元列表
  async loadUnits(subject) {
    wx.showLoading({ title: '加载中...' })
    try {
      const units = await getUnits({ subject })
      this.setData({ units, selectedUnitIds: [] })
    } catch (err) {
      wx.showToast({ title: '单元加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 单元多选切换
  onUnitToggle(e) {
    const unitId = e.currentTarget.dataset.id
    let { selectedUnitIds } = this.data
    if (selectedUnitIds.includes(unitId)) {
      selectedUnitIds = selectedUnitIds.filter(id => id !== unitId)
    } else {
      selectedUnitIds.push(unitId)
    }
    this.setData({ selectedUnitIds })
  },

  // 模式切换
  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.value })
  },

  // 最小数量滑块
  onMinChange(e) {
    let min = e.detail.value
    const max = this.data.countMax
    if (min > max) min = max
    this.setData({
      countMin: min,
      wordCountRange: { min, max }
    })
  },

  // 最大数量滑块
  onMaxChange(e) {
    let max = e.detail.value
    const min = this.data.countMin
    if (max < min) max = min
    this.setData({
      countMax: max,
      wordCountRange: { min, max }
    })
  },

  // 间隔时间
  onIntervalChange(e) {
    this.setData({ interval: e.detail.value })
  },

  // 开始听写
  async onStart() {
    const { subject, selectedUnitIds, mode, wordCountRange, interval } = this.data

    if (selectedUnitIds.length === 0) {
      wx.showToast({ title: '请至少选择一个单元', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '生成听写...' })

    try {
      const res = await getDictationList({
        unitIds: selectedUnitIds,
        subject,
        wordCountRange,
        mode
      })

      if (res.code !== 0) {
        wx.showToast({ title: res.message, icon: 'none' })
        return
      }

      if (res.data.words.length === 0) {
        wx.showToast({ title: '未抽到单词', icon: 'none' })
        return
      }

      // 跳转听写页，传递题目与配置
      wx.navigateTo({
        url: `/pages/dictation/dictation?mode=${mode}&interval=${interval}&subject=${subject}`,
        success: (nav) => {
          // 通过事件通道传递大数据，避免 URL 过长
          nav.eventChannel.emit('dictationData', {
            questions: res.data.words,
            total: res.data.total,
            unitIds: selectedUnitIds
          })
        }
      })
    } catch (err) {
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
      wx.hideLoading()
    }
  },

  // 跳转拍照页
  onScan() {
    wx.navigateTo({ url: '/pages/scan/scan' })
  },

  // 跳转我的
  onProfile() {
    wx.switchTab && wx.navigateTo({ url: '/pages/profile/profile' })
  }
})
