// pages/words/words.js - 单词管理页（支持自定义录音）
const { getWordsByUnit, saveWord, deleteWord } = require('../../utils/cloudApi.js')
const audio = require('../../utils/audio.js')
const { SUBJECTS, SUBJECT_LABELS } = require('../../utils/constants.js')
const { toast, loading, hideLoading, modal } = require('../../utils/ui.js')

Page({
  data: {
    unitId: '',
    unitName: '',
    subject: SUBJECTS.ENGLISH,
    subjectLabel: SUBJECT_LABELS[SUBJECTS.ENGLISH],
    isEnglish: true,
    isChinese: false,
    words: [],
    loading: false,

    showModal: false,
    editing: false,
    submitting: false,
    deleting: false,
    form: {
      _id: '',
      word: '',
      meaning: '',
      pinyin: '',
      phonetic: '',
      partOfSpeech: '',
      lesson: 1,
      audioUrl: ''
    },

    recordState: 'idle', // idle | recording | uploading
    recordText: '点击录音'
  },

  onLoad(options) {
    const { unitId, unitName = '单元', subject = SUBJECTS.ENGLISH } = options
    if (!unitId) {
      toast('缺少单元信息')
      wx.navigateBack()
      return
    }
    this.setData({
      unitId,
      unitName: decodeURIComponent(unitName),
      subject,
      subjectLabel: SUBJECT_LABELS[subject] || '',
      isEnglish: subject === SUBJECTS.ENGLISH,
      isChinese: subject === SUBJECTS.CHINESE
    })
    // 由 onShow 统一加载，避免 onLoad + onShow 重复请求
  },

  onShow() {
    this.loadWords()
  },

  onPullDownRefresh() {
    this.loadWords()
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh())
  },

  onUnload() {
    if (this.data.recordState === 'recording') {
      audio.stopRecord().catch(() => {})
    }
    // 退出页面时停止音频播放，避免后台继续播放
    audio.stopPlay()
  },

  async loadWords() {
    const { unitId } = this.data
    this.setData({ loading: true })
    try {
      const res = await getWordsByUnit(unitId)
      if (res.code === 0) {
        this.setData({ words: res.data || [] })
      } else {
        toast(res.message || '加载失败')
      }
    } catch (err) {
      toast('单词加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  onAdd() {
    this.setData({
      showModal: true,
      editing: false,
      form: {
        _id: '',
        word: '',
        meaning: '',
        pinyin: '',
        phonetic: '',
        partOfSpeech: '',
        lesson: 1,
        audioUrl: ''
      },
      recordState: 'idle',
      recordText: '点击录音'
    })
  },

  onEdit(e) {
    // 仅传 _id，从本地列表查找，避免 dataset 序列化大对象
    const itemId = e.currentTarget.dataset.id
    const item = this.data.words.find(w => w._id === itemId)
    if (!item) {
      toast('单词信息丢失，请刷新')
      return
    }
    this.setData({
      showModal: true,
      editing: true,
      form: {
        _id: item._id,
        word: item.word,
        meaning: item.meaning,
        pinyin: item.pinyin || '',
        phonetic: item.phonetic || '',
        partOfSpeech: item.partOfSpeech || '',
        lesson: item.lesson || 1,
        audioUrl: item.audioUrl || ''
      },
      recordState: 'idle',
      recordText: '点击录音'
    })
  },

  onHideModal() {
    if (this.data.recordState === 'recording') {
      this.stopRecording().catch(() => {})
    }
    this.setData({ showModal: false })
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onNumberInput(e) {
    const { field } = e.currentTarget.dataset
    const value = parseInt(e.detail.value, 10) || 1
    this.setData({ [`form.${field}`]: value })
  },

  async onSubmit() {
    if (this.data.submitting) return
    const { form, unitId, subject, editing } = this.data
    if (!form.word.trim() || !form.meaning.trim()) {
      toast('单词和释义不能为空')
      return
    }

    this.setData({ submitting: true })
    loading(editing ? '保存中...' : '添加中...')

    try {
      const word = {
        _id: form._id || undefined,
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        unitId,
        subject,
        pinyin: form.pinyin.trim(),
        phonetic: form.phonetic.trim(),
        partOfSpeech: form.partOfSpeech.trim(),
        lesson: Number(form.lesson) || 1,
        audioUrl: form.audioUrl.trim()
      }
      const res = await saveWord(word)
      if (res.code !== 0) {
        toast(res.message || '保存失败')
        return
      }
      toast(editing ? '保存成功' : '添加成功', 'success')
      this.onHideModal()
      this.loadWords()
    } catch (err) {
      toast('操作失败')
    } finally {
      this.setData({ submitting: false })
      hideLoading()
    }
  },

  async onDelete(e) {
    if (this.data.deleting) return
    const id = e.currentTarget.dataset.id
    const res = await modal('确认删除', '删除后无法恢复，确定吗？', { confirmColor: '#ef4444' })
    if (!res.confirm) return

    this.setData({ deleting: true })
    loading('删除中...')
    try {
      const result = await deleteWord(id)
      if (result.code !== 0) {
        toast(result.message || '删除失败')
        return
      }
      toast('删除成功', 'success')
      this.loadWords()
    } catch (err) {
      toast('删除失败')
    } finally {
      this.setData({ deleting: false })
      hideLoading()
    }
  },

  async toggleRecord() {
    if (this.data.recordState === 'idle') {
      try {
        await audio.startRecord()
        this.setData({ recordState: 'recording', recordText: '正在录音，点击结束' })
      } catch (err) {
        const errMsg = (err && err.errMsg) || ''
        const isAuthError = /authorize|auth|permission|denied/i.test(errMsg)
        if (isAuthError) {
          // 权限被拒时引导用户去设置页开启
          modal('需要录音权限', '录音功能需要授权才能使用，请在设置中开启录音权限。', {
            confirmText: '去设置',
            success(res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          toast('录音启动失败，请重试')
          console.error('录音启动失败:', err)
        }
      }
    } else if (this.data.recordState === 'recording') {
      this.setData({ recordState: 'uploading', recordText: '上传中...' })
      try {
        const { tempFilePath } = await audio.stopRecord()
        const fileID = await audio.uploadAudio(tempFilePath)
        this.setData({
          'form.audioUrl': fileID,
          recordState: 'idle',
          recordText: '点击录音'
        })
        toast('录音已保存', 'success')
      } catch (err) {
        console.error('录音上传失败:', err)
        toast('录音上传失败')
        this.setData({ recordState: 'idle', recordText: '点击录音' })
      }
    }
  },

  playFormAudio() {
    const { audioUrl } = this.data.form
    if (!audioUrl) return
    audio.playAudio(audioUrl)
  },

  playItemAudio(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    audio.playAudio(url)
  },

  removeAudio() {
    this.setData({ 'form.audioUrl': '' })
  }
})
