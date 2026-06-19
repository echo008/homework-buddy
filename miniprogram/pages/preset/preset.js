// pages/preset/preset.js - 智能选题：按学段/教材/单元自动选择听写内容
const {
  listPresetFilters,
  listPresetTextbooks,
  listPresetUnits,
  importPresetUnits,
  getDictationList
} = require('../../utils/cloudApi.js')

const GRADE_LEVEL_SUBJECTS = {
  chinese: ['chinese'],
  english: ['english'],
  national: ['chinese', 'english']
}

Page({
  data: {
    loading: true,
    submitting: false,
    importing: false,

    // 筛选维度
    gradeLevels: [],
    subjects: [
      { value: 'chinese', label: '语文' },
      { value: 'english', label: '英语' }
    ],
    versions: [],
    contentTypes: [],

    // 已选条件
    selectedGradeLevel: 'primary',
    selectedSubject: 'chinese',
    selectedVersion: '',
    selectedContentType: '',
    selectedTextbook: null,

    // 列表数据
    textbooks: [],
    units: [],

    // 单元选择（同样使用 Map 兼容旧版基础库）
    selectedUnitIds: [],
    selectedUnitMap: {}
  },

  async onLoad() {
    // 请求序列号，防止快速切换条件时旧请求覆盖新结果
    this._textbookReqSeq = 0
    this._unitReqSeq = 0
    await this.loadFilters()
    await this.loadTextbooks()
    this.setData({ loading: false })
  },

  async loadFilters() {
    try {
      const res = await listPresetFilters()
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '加载筛选失败', icon: 'none' })
        return
      }
      const { gradeLevels, versions, contentTypes } = res.data || {}
      this.setData({
        gradeLevels: gradeLevels || [],
        versions: versions || [],
        contentTypes: contentTypes || []
      })
    } catch (err) {
      console.error('加载筛选维度失败:', err)
      wx.showToast({ title: '加载筛选失败', icon: 'none' })
    }
  },

  async loadTextbooks() {
    const seq = ++this._textbookReqSeq
    const { selectedGradeLevel, selectedSubject, selectedVersion } = this.data
    try {
      const res = await listPresetTextbooks({
        gradeLevel: selectedGradeLevel,
        subject: selectedSubject,
        version: selectedVersion
      })
      // 快速切换条件时，丢弃过期请求结果
      if (seq !== this._textbookReqSeq) return
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '加载教材失败', icon: 'none' })
        this.setData({ textbooks: [], units: [] })
        return
      }
      const textbooks = res.data || []
      this.setData({ textbooks, selectedTextbook: null, units: [], selectedUnitIds: [], selectedUnitMap: {} })

      // 若只有一本教材，自动选中
      if (textbooks.length === 1) {
        this.setData({ selectedTextbook: textbooks[0] })
        await this.loadUnits(textbooks[0]._id)
      }
    } catch (err) {
      if (seq !== this._textbookReqSeq) return
      console.error('加载教材失败:', err)
      wx.showToast({ title: '加载教材失败', icon: 'none' })
    }
  },

  async loadUnits(textbookId) {
    if (!textbookId) return
    const seq = ++this._unitReqSeq
    const { selectedSubject, selectedContentType } = this.data
    try {
      const res = await listPresetUnits({
        textbookId,
        subject: selectedSubject,
        contentType: selectedContentType
      })
      if (seq !== this._unitReqSeq) return
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '加载单元失败', icon: 'none' })
        this.setData({ units: [], selectedUnitIds: [], selectedUnitMap: {} })
        return
      }
      this.setData({
        units: res.data || [],
        selectedUnitIds: [],
        selectedUnitMap: {}
      })
    } catch (err) {
      if (seq !== this._unitReqSeq) return
      console.error('加载单元失败:', err)
      wx.showToast({ title: '加载单元失败', icon: 'none' })
    }
  },

  onGradeChange(e) {
    const selectedGradeLevel = e.currentTarget.dataset.value
    const availableSubjects = GRADE_LEVEL_SUBJECTS[selectedGradeLevel] || GRADE_LEVEL_SUBJECTS.national
    const selectedSubject = availableSubjects.includes(this.data.selectedSubject)
      ? this.data.selectedSubject
      : availableSubjects[0]
    this.setData({ selectedGradeLevel, selectedSubject }, () => {
      this.loadTextbooks()
    })
  },

  onSubjectChange(e) {
    this.setData({ selectedSubject: e.currentTarget.dataset.value }, () => {
      this.loadTextbooks()
    })
  },

  onVersionChange(e) {
    const value = e.currentTarget.dataset.value
    const selectedVersion = this.data.selectedVersion === value ? '' : value
    this.setData({ selectedVersion }, () => {
      this.loadTextbooks()
    })
  },

  onContentTypeChange(e) {
    this.setData({ selectedContentType: e.currentTarget.dataset.value }, () => {
      const { selectedTextbook } = this.data
      if (selectedTextbook) {
        this.loadUnits(selectedTextbook._id)
      }
    })
  },

  onTextbookSelect(e) {
    const textbook = e.currentTarget.dataset.item
    this.setData({ selectedTextbook: textbook })
    this.loadUnits(textbook._id)
  },

  syncSelectedMap(selectedUnitIds) {
    const selectedUnitMap = {}
    selectedUnitIds.forEach(id => { selectedUnitMap[id] = true })
    return selectedUnitMap
  },

  onUnitToggle(e) {
    const unitId = e.currentTarget.dataset.id
    let selectedUnitIds = [...this.data.selectedUnitIds]
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

  async onImport() {
    const { selectedUnitIds } = this.data
    if (selectedUnitIds.length === 0) {
      wx.showToast({ title: '请先选择单元', icon: 'none' })
      return
    }
    if (this.data.importing) return
    this.setData({ importing: true })
    wx.showLoading({ title: '导入中...' })
    try {
      const res = await importPresetUnits({ presetUnitIds: selectedUnitIds })
      wx.hideLoading()
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '导入失败', icon: 'none' })
        return
      }
      wx.showModal({
        title: '导入成功',
        content: `${res.data.successCount} 个单元已加入「我的单元」，是否立即前往听写？`,
        confirmText: '去听写',
        cancelText: '再逛逛',
        success: (r) => {
          if (r.confirm) {
            wx.reLaunch({ url: '/pages/index/index' })
          }
        }
      })
    } catch (err) {
      wx.hideLoading()
      console.error('导入失败:', err)
      wx.showToast({ title: '导入失败', icon: 'none' })
    } finally {
      this.setData({ importing: false })
    }
  },

  async onStartDictation() {
    const { selectedUnitIds, selectedSubject, selectedTextbook } = this.data
    if (selectedUnitIds.length === 0) {
      wx.showToast({ title: '请先选择单元', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '准备题目...' })

    try {
      const res = await getDictationList({
        presetUnitIds: selectedUnitIds,
        subject: selectedSubject,
        wordCountRange: { min: 5, max: 30 }
      })
      wx.hideLoading()

      if (res.code !== 0) {
        wx.showToast({ title: res.message || '生成题目失败', icon: 'none' })
        this.setData({ submitting: false })
        return
      }

      const questions = (res.data && res.data.words) || []
      if (questions.length === 0) {
        wx.showToast({ title: '所选单元暂无内容', icon: 'none' })
        this.setData({ submitting: false })
        return
      }

      // 记录教材信息用于结果页
      const textbookName = selectedTextbook ? selectedTextbook.name : ''

      wx.navigateTo({
        url: `/pages/dictation/dictation?mode=${res.data.mode}&subject=${selectedSubject}&interval=5`,
        success: (navRes) => {
          navRes.eventChannel.emit('dictationData', {
            questions,
            total: res.data.total,
            unitIds: selectedUnitIds,
            textbookName,
            source: 'preset'
          })
        },
        complete: () => {
          this.setData({ submitting: false })
        }
      })
    } catch (err) {
      wx.hideLoading()
      console.error('生成题目失败:', err)
      wx.showToast({ title: '生成题目失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  goCustomInput() {
    wx.reLaunch({ url: `/pages/index/index?subject=${this.data.selectedSubject}` })
  }
})
