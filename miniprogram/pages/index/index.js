// pages/index/index.js - 首页：听写配置
const { getDictationList, saveWord, getManagedUnits } = require('../../utils/cloudApi.js')

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
    selectedUnitMap: {}, // WXML 不支持 Array.includes，预计算选中映射

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

    submitting: false,

    // 手动加词弹窗
    showAddModal: false,
    addForm: {
      word: '',
      meaning: '',
      pinyin: '',
      partOfSpeech: '',
      phonetic: '',
      lesson: 1
    },
    adding: false
  },

  onLoad() {
    // 首次加载由 onShow 统一触发，避免重复请求
  },

  onShow() {
    // 每次展示时刷新单元词数（从其他页返回后也能看到最新数据）
    this.loadUnits(this.data.subject)
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

  // 加载单元列表（走云函数，按当前用户 createdBy 过滤）
  async loadUnits(subject) {
    // 首次加载（units 为空）才显示 loading，避免从其他页返回时频繁闪烁
    const isFirstLoad = this.data.units.length === 0 && !this._loadedOnce
    if (isFirstLoad) wx.showLoading({ title: '加载中...' })
    try {
      const res = await getManagedUnits(subject)
      const units = (res && res.code === 0) ? (res.data || []) : []
      this.setData({ units, selectedUnitIds: [], selectedUnitMap: {} })
      this._loadedOnce = true
    } catch (err) {
      wx.showToast({ title: '单元加载失败', icon: 'none' })
    } finally {
      if (isFirstLoad) wx.hideLoading()
    }
  },

  // 将选中 ID 数组同步为 WXML 可用的 Map
  syncSelectedMap(selectedUnitIds) {
    const selectedUnitMap = {}
    selectedUnitIds.forEach(id => { selectedUnitMap[id] = true })
    return selectedUnitMap
  },

  // 全选/取消全选单元
  onToggleAll() {
    const { units, selectedUnitIds } = this.data
    let nextIds = []
    if (selectedUnitIds.length !== units.length) {
      nextIds = units.map(u => u._id)
    }
    this.setData({
      selectedUnitIds: nextIds,
      selectedUnitMap: this.syncSelectedMap(nextIds)
    })
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
    this.setData({
      selectedUnitIds,
      selectedUnitMap: this.syncSelectedMap(selectedUnitIds)
    })
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
        wx.showToast({ title: res.message || '生成失败', icon: 'none' })
        return
      }

      if (!res.data || !res.data.words || res.data.words.length === 0) {
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
        },
        fail: (err) => {
          console.error('跳转听写页失败:', err)
          wx.showToast({ title: '页面跳转失败，请重试', icon: 'none' })
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
    const { subject, selectedUnitIds } = this.data
    if (selectedUnitIds.length === 0) {
      wx.showToast({ title: '请先选择一个单元', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/scan/scan?subject=${subject}&unitId=${selectedUnitIds[0]}`
    })
  },

  // 快捷入口
  goUnits() {
    wx.navigateTo({ url: '/pages/units/units' })
  },

  goClass() {
    wx.navigateTo({ url: '/pages/class/class' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  // 跳转智能选题页
  goPreset() {
    wx.navigateTo({ url: '/pages/preset/preset' })
  },

  // ========== 手动加词 ==========
  onShowAddModal() {
    const { selectedUnitIds, subject } = this.data
    if (selectedUnitIds.length === 0) {
      wx.showToast({ title: '请先选择一个单元', icon: 'none' })
      return
    }
    this.setData({
      showAddModal: true,
      addForm: {
        word: '',
        meaning: '',
        pinyin: '',
        partOfSpeech: '',
        phonetic: '',
        lesson: 1
      }
    })
  },

  onHideAddModal() {
    this.setData({ showAddModal: false })
  },

  onAddInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`addForm.${field}`]: value
    })
  },

  onAddNumberInput(e) {
    const { field } = e.currentTarget.dataset
    const value = parseInt(e.detail.value, 10) || 1
    this.setData({
      [`addForm.${field}`]: value
    })
  },

  async onAddSubmit() {
    const { addForm, selectedUnitIds, subject } = this.data
    const unitId = selectedUnitIds[0]

    if (!addForm.word.trim() || !addForm.meaning.trim()) {
      wx.showToast({ title: '单词和释义不能为空', icon: 'none' })
      return
    }

    this.setData({ adding: true })
    wx.showLoading({ title: '添加中...' })

    try {
      const res = await saveWord({
        word: addForm.word.trim(),
        meaning: addForm.meaning.trim(),
        unitId,
        subject,
        pinyin: addForm.pinyin.trim(),
        partOfSpeech: addForm.partOfSpeech.trim(),
        phonetic: addForm.phonetic.trim(),
        lesson: Number(addForm.lesson) || 1
      })

      if (res.code !== 0) {
        wx.showToast({ title: res.message || '添加失败', icon: 'none' })
        return
      }

      wx.showToast({ title: '添加成功', icon: 'success' })
      this.onHideAddModal()
      this.loadUnits(subject)
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      this.setData({ adding: false })
      wx.hideLoading()
    }
  }
})
