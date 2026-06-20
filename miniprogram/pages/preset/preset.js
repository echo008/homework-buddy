// pages/preset/preset.js - 智能选题：按学段/教材/单元自动选择听写内容
const {
  listPresetFilters,
  listPresetTextbooks,
  listPresetUnits,
  importPresetUnits,
  getDictationList
} = require('../../utils/cloudApi.js')
const { generatePresetUnitAudio } = require('../../utils/batchTts.js')
const {
  SUBJECTS,
  GRADE_LEVELS,
  SUBJECT_LABELS,
  getDefaultMode
} = require('../../utils/constants.js')
const { toast, loading, hideLoading, modal } = require('../../utils/ui.js')

const GRADE_LEVEL_SUBJECTS = {
  [GRADE_LEVELS.PRIMARY]: [SUBJECTS.CHINESE, SUBJECTS.ENGLISH],
  [GRADE_LEVELS.JUNIOR]: [SUBJECTS.CHINESE, SUBJECTS.ENGLISH],
  [GRADE_LEVELS.SENIOR]: [SUBJECTS.CHINESE, SUBJECTS.ENGLISH],
  [GRADE_LEVELS.NATIONAL]: [SUBJECTS.CHINESE, SUBJECTS.ENGLISH]
}

Page({
  data: {
    loading: true,
    submitting: false,
    importing: false,

    // 筛选维度
    gradeLevels: [],
    subjects: [
      { value: SUBJECTS.CHINESE, label: SUBJECT_LABELS[SUBJECTS.CHINESE] },
      { value: SUBJECTS.ENGLISH, label: SUBJECT_LABELS[SUBJECTS.ENGLISH] }
    ],
    versions: [],
    contentTypes: [],

    // 已选条件
    selectedGradeLevel: GRADE_LEVELS.PRIMARY,
    selectedSubject: SUBJECTS.CHINESE,
    selectedVersion: '',
    selectedContentType: '',
    selectedTextbook: null,

    // 列表数据
    textbooks: [],
    units: [],

    // 单元选择（同样使用 Map 兼容旧版基础库）
    selectedUnitIds: [],
    selectedUnitMap: {},

    // 批量音频生成状态
    generatingAudio: false,
    audioProgress: { current: 0, total: 0, word: '' }
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
        toast(res.message || '加载筛选失败')
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
      toast('加载筛选失败')
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
        toast(res.message || '加载教材失败')
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
      toast('加载教材失败')
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
        toast(res.message || '加载单元失败')
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
      toast('加载单元失败')
    }
  },

  onGradeChange(e) {
    const selectedGradeLevel = e.currentTarget.dataset.value
    const availableSubjects = GRADE_LEVEL_SUBJECTS[selectedGradeLevel] || GRADE_LEVEL_SUBJECTS[GRADE_LEVELS.NATIONAL]
    const selectedSubject = availableSubjects.includes(this.data.selectedSubject)
      ? this.data.selectedSubject
      : availableSubjects[0]
    const validTypes = (this.data.contentTypes || [])
      .filter(t => !t.subject || t.subject === selectedSubject)
      .map(t => t.value)
    const selectedContentType = validTypes.includes(this.data.selectedContentType)
      ? this.data.selectedContentType
      : ''
    this.setData({ selectedGradeLevel, selectedSubject, selectedContentType }, () => {
      this.loadTextbooks()
    })
  },

  onSubjectChange(e) {
    const selectedSubject = e.currentTarget.dataset.value
    // 切换学科后，若当前内容类型不适用则清空
    const validTypes = (this.data.contentTypes || [])
      .filter(t => !t.subject || t.subject === selectedSubject)
      .map(t => t.value)
    const selectedContentType = validTypes.includes(this.data.selectedContentType)
      ? this.data.selectedContentType
      : ''
    this.setData({ selectedSubject, selectedContentType }, () => {
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
      toast('请先选择单元')
      return
    }
    if (this.data.importing) return
    this.setData({ importing: true })
    loading('导入中...')
    try {
      const res = await importPresetUnits({ presetUnitIds: selectedUnitIds })
      hideLoading()
      if (res.code !== 0) {
        toast(res.message || '导入失败')
        return
      }
      modal('导入成功', `${res.data.successCount} 个单元已加入「我的单元」，是否立即前往听写？`, {
        confirmText: '去听写',
        cancelText: '再逛逛'
      }).then((r) => {
        if (r.confirm) {
          wx.reLaunch({ url: '/pages/index/index' })
        }
      })
    } catch (err) {
      hideLoading()
      console.error('导入失败:', err)
      toast('导入失败')
    } finally {
      this.setData({ importing: false })
    }
  },

  async onStartDictation() {
    const { selectedUnitIds, selectedSubject, selectedTextbook } = this.data
    if (selectedUnitIds.length === 0) {
      toast('请先选择单元')
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    loading('准备题目...')

    try {
      const mode = getDefaultMode(selectedSubject)
      const res = await getDictationList({
        presetUnitIds: selectedUnitIds,
        subject: selectedSubject,
        mode,
        wordCountRange: { min: 5, max: 30 }
      })
      hideLoading()

      if (res.code !== 0) {
        toast(res.message || '生成题目失败')
        this.setData({ submitting: false })
        return
      }

      const questions = (res.data && res.data.words) || []
      if (questions.length === 0) {
        toast('所选单元暂无内容')
        this.setData({ submitting: false })
        return
      }

      const textbookName = selectedTextbook ? selectedTextbook.name : ''
      const finalMode = (res.data && res.data.mode) || mode

      wx.navigateTo({
        url: `/pages/dictation/dictation?mode=${encodeURIComponent(finalMode)}&subject=${encodeURIComponent(selectedSubject)}&interval=5`,
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
      hideLoading()
      console.error('生成题目失败:', err)
      toast('生成题目失败')
      this.setData({ submitting: false })
    }
  },

  // 为选中的预置单元批量生成 TTS 音频并上传云存储
  async onBatchGenerateAudio() {
    const { selectedUnitIds, units, generatingAudio } = this.data
    if (generatingAudio) return
    if (selectedUnitIds.length === 0) {
      toast('请先选择单元')
      return
    }

    const selectedUnits = units.filter(u => selectedUnitIds.includes(u._id))
    const totalWords = selectedUnits.reduce((sum, u) => sum + (u.wordCount || 0), 0)
    if (totalWords === 0) {
      toast('所选单元暂无内容')
      return
    }

    const confirmed = await modal(
      '批量生成音频',
      `将为 ${selectedUnitIds.length} 个单元约 ${totalWords} 条内容生成音频，耗时较长且消耗流量，是否继续？`,
      { confirmText: '开始生成' }
    )
    if (!confirmed.confirm) return

    this.setData({ generatingAudio: true, audioProgress: { current: 0, total: 0, word: '' } })
    loading('音频生成中...')

    let overallSuccess = 0
    let overallFail = 0
    for (const unit of selectedUnits) {
      try {
        const res = await generatePresetUnitAudio(unit._id, {
          batchSize: 20,
          onProgress: (current, total, word) => {
            this.setData({ audioProgress: { current, total, word } })
          }
        })
        overallSuccess += res.success
        overallFail += res.fail
      } catch (err) {
        console.error(`单元 ${unit.name} 音频生成失败:`, err)
        overallFail += unit.wordCount || 0
      }
    }

    hideLoading()
    this.setData({ generatingAudio: false, audioProgress: { current: 0, total: 0, word: '' } })
    modal('生成完成', `成功 ${overallSuccess} 条，失败 ${overallFail} 条`, { showCancel: false })
  },

  goCustomInput() {
    wx.reLaunch({ url: `/pages/index/index?subject=${encodeURIComponent(this.data.selectedSubject)}` })
  }
})
