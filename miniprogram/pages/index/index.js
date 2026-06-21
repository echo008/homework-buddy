// pages/index/index.js - 首页：听写配置
const { getDictationList, saveWord, getManagedUnits } = require('../../utils/cloudApi.js')
const { SUBJECTS, MODES, SUBJECT_LABELS, MODE_LABELS } = require('../../utils/constants.js')
const { toast, loading, hideLoading } = require('../../utils/ui.js')

function getSubjectDerived(subject) {
  return {
    subjectLabel: SUBJECT_LABELS[subject] || '',
    isEnglish: subject === SUBJECTS.ENGLISH,
    isChinese: subject === SUBJECTS.CHINESE
  }
}

Page({
  data: {
    // 学科切换
    subject: SUBJECTS.ENGLISH,
    subjectLabel: SUBJECT_LABELS[SUBJECTS.ENGLISH],
    isEnglish: true,
    isChinese: false,
    subjectTabs: [
      { key: SUBJECTS.ENGLISH, label: SUBJECT_LABELS[SUBJECTS.ENGLISH] },
      { key: SUBJECTS.CHINESE, label: SUBJECT_LABELS[SUBJECTS.CHINESE] }
    ],

    // 单元列表
    units: [],
    selectedUnitIds: [],
    selectedUnitMap: {}, // WXML 不支持 Array.includes，预计算选中映射

    // 听写模式
    mode: MODES.EN2CN,
    modeOptions: {
      [SUBJECTS.ENGLISH]: [
        { value: MODES.EN2CN, label: MODE_LABELS[MODES.EN2CN] },
        { value: MODES.CN2EN, label: MODE_LABELS[MODES.CN2EN] }
      ],
      [SUBJECTS.CHINESE]: [
        { value: MODES.PINYIN2HANZI, label: MODE_LABELS[MODES.PINYIN2HANZI] },
        { value: MODES.HANZI2PINYIN, label: MODE_LABELS[MODES.HANZI2PINYIN] }
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

  onLoad(options) {
    this._unitReqSeq = 0
    // 支持外部跳转携带学科与模式（如班级详情页"去听写"、结果页"再测一组"）
    const subject = options && options.subject
    const validSubjects = Object.values(SUBJECTS)
    if (subject && validSubjects.includes(subject)) {
      const modes = this.data.modeOptions[subject]
      const validModes = modes.map(m => m.value)
      const mode = options.mode && validModes.includes(options.mode) ? options.mode : modes[0].value
      this.setData({ subject, mode, ...getSubjectDerived(subject) })
    }
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
      mode: modes[0].value,
      ...getSubjectDerived(subject)
    })
    this.loadUnits(subject)
  },

  // 加载单元列表（走云函数，按当前用户 createdBy 过滤）
  async loadUnits(subject) {
    const seq = ++this._unitReqSeq
    // 首次加载（units 为空）才显示 loading，避免从其他页返回时频繁闪烁
    const isFirstLoad = this.data.units.length === 0 && !this._loadedOnce
    if (isFirstLoad) loading('加载中...')
    try {
      const res = await getManagedUnits(subject)
      if (seq !== this._unitReqSeq) return
      const units = (res && res.code === 0) ? (res.data || []) : []
      // 刷新后保留仍然存在的选中单元，避免用户从其他页面返回后需重新选择
      const validIds = new Set(units.map(u => u._id))
      const selectedUnitIds = (this.data.selectedUnitIds || []).filter(id => validIds.has(id))
      this.setData({
        units,
        selectedUnitIds,
        selectedUnitMap: this.syncSelectedMap(selectedUnitIds)
      })
      this._loadedOnce = true
    } catch (err) {
      if (seq !== this._unitReqSeq) return
      toast('单元加载失败')
    } finally {
      if (isFirstLoad && seq === this._unitReqSeq) hideLoading()
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
      toast('请至少选择一个单元')
      return
    }

    this.setData({ submitting: true })
    loading('生成听写...')

    try {
      const res = await getDictationList({
        unitIds: selectedUnitIds,
        subject,
        wordCountRange,
        mode
      })

      if (res.code !== 0) {
        toast(res.message || '生成失败')
        return
      }

      if (!res.data || !res.data.words || res.data.words.length === 0) {
        toast('未抽到单词')
        return
      }

      // 跳转听写页，传递题目与配置
      wx.navigateTo({
        url: `/pages/dictation/dictation?mode=${encodeURIComponent(mode)}&interval=${interval}&subject=${encodeURIComponent(subject)}&min=${wordCountRange.min}&max=${wordCountRange.max}`,
        success: (nav) => {
          // 通过事件通道传递大数据，避免 URL 过长
          nav.eventChannel.emit('dictationData', {
            questions: res.data.words,
            total: res.data.total,
            unitIds: selectedUnitIds,
            wordCountRange
          })
        },
        fail: (err) => {
          console.error('跳转听写页失败:', err)
          toast('页面跳转失败，请重试')
        }
      })
    } catch (err) {
      toast('生成失败，请重试')
    } finally {
      this.setData({ submitting: false })
      hideLoading()
    }
  },

  // 跳转拍照页
  onScan() {
    const { subject, selectedUnitIds } = this.data
    if (selectedUnitIds.length === 0) {
      toast('请先选择一个单元')
      return
    }
    wx.navigateTo({
      url: `/pages/scan/scan?subject=${encodeURIComponent(subject)}&unitId=${encodeURIComponent(selectedUnitIds[0])}`
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
    const { selectedUnitIds } = this.data
    if (selectedUnitIds.length === 0) {
      toast('请先选择一个单元')
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
    if (this.data.adding) return
    const { addForm, selectedUnitIds, subject } = this.data
    const unitId = selectedUnitIds[0]

    if (!addForm.word.trim() || !addForm.meaning.trim()) {
      toast('单词和释义不能为空')
      return
    }

    this.setData({ adding: true })
    loading('添加中...')

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
        toast(res.message || '添加失败')
        return
      }

      toast('添加成功', 'success')
      this.onHideAddModal()
      this.loadUnits(subject)
    } catch (err) {
      toast('添加失败')
    } finally {
      this.setData({ adding: false })
      hideLoading()
    }
  }
})
