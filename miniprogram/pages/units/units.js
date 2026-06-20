// pages/units/units.js - 单元管理页
const { getManagedUnits, saveUnit, deleteUnit } = require('../../utils/cloudApi.js')
const { SUBJECTS, SUBJECT_LABELS } = require('../../utils/constants.js')
const { toast, loading, hideLoading, modal } = require('../../utils/ui.js')

Page({
  data: {
    subject: SUBJECTS.ENGLISH,
    subjectTabs: [
      { key: SUBJECTS.ENGLISH, label: SUBJECT_LABELS[SUBJECTS.ENGLISH] },
      { key: SUBJECTS.CHINESE, label: SUBJECT_LABELS[SUBJECTS.CHINESE] }
    ],
    units: [],
    loading: false,
    showModal: false,
    editing: false,
    submitting: false,
    deleting: false,
    form: {
      _id: '',
      name: '',
      grade: '',
      semester: '',
      textbook: '',
      order: 0
    }
  },

  onLoad() {
    // 由 onShow 统一加载，避免 onLoad + onShow 重复请求
    this._unitReqSeq = 0
  },

  onShow() {
    this.loadUnits()
  },

  onPullDownRefresh() {
    this.loadUnits()
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh())
  },

  onSubjectChange(e) {
    const subject = e.currentTarget.dataset.key
    this.setData({ subject })
    this.loadUnits()
  },

  async loadUnits() {
    const seq = ++this._unitReqSeq
    this.setData({ loading: true })
    try {
      const res = await getManagedUnits(this.data.subject)
      if (seq !== this._unitReqSeq) return
      if (res.code === 0) {
        // 单元管理页只应展示当前用户自己创建的单元，过滤掉班级共享单元
        const app = getApp()
        let openid = app.globalData.openid
        if (!openid) {
          try {
            openid = await app.ensureOpenid()
          } catch (err) {
            console.error('获取 openid 失败:', err)
          }
        }
        const units = (res.data || []).filter(u => u.createdBy === openid)
        this.setData({ units })
      } else {
        toast(res.message || '加载失败')
      }
    } catch (err) {
      if (seq !== this._unitReqSeq) return
      toast('单元加载失败')
    } finally {
      if (seq === this._unitReqSeq) {
        this.setData({ loading: false })
      }
    }
  },

  onAdd() {
    this.setData({
      showModal: true,
      editing: false,
      form: {
        _id: '',
        name: '',
        grade: '',
        semester: '',
        textbook: '',
        order: 0
      }
    })
  },

  onEdit(e) {
    // 仅传 _id，从本地列表查找，避免 dataset 序列化大对象
    const unitId = e.currentTarget.dataset.id
    const unit = this.data.units.find(u => u._id === unitId)
    if (!unit) {
      toast('单元信息丢失，请刷新')
      return
    }
    this.setData({
      showModal: true,
      editing: true,
      form: {
        _id: unit._id,
        name: unit.name,
        grade: unit.grade || '',
        semester: unit.semester || '',
        textbook: unit.textbook || '',
        order: unit.order || 0
      }
    })
  },

  onHideModal() {
    this.setData({ showModal: false })
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  onNumberInput(e) {
    const { field } = e.currentTarget.dataset
    const value = parseInt(e.detail.value, 10) || 0
    this.setData({
      [`form.${field}`]: value
    })
  },

  async onSubmit() {
    if (this.data.submitting) return
    const { form, subject, editing } = this.data
    if (!form.name || !form.name.trim()) {
      toast('单元名称不能为空')
      return
    }

    this.setData({ submitting: true })
    loading(editing ? '保存中...' : '创建中...')

    try {
      const unit = {
        _id: form._id || undefined,
        name: form.name.trim(),
        subject,
        grade: form.grade.trim(),
        semester: form.semester.trim(),
        textbook: form.textbook.trim(),
        order: Number(form.order) || 0
      }
      const res = await saveUnit(unit)
      if (res.code !== 0) {
        toast(res.message || '保存失败')
        return
      }
      toast(editing ? '保存成功' : '创建成功', 'success')
      this.onHideModal()
      this.loadUnits()
    } catch (err) {
      toast('操作失败')
    } finally {
      this.setData({ submitting: false })
      hideLoading()
    }
  },

  async onDelete(e) {
    if (this.data.deleting) return
    const { id, name } = e.currentTarget.dataset
    const res = await modal('确认删除', `删除单元「${name}」将同时删除其下所有单词，确定吗？`, { confirmColor: '#ef4444' })
    if (!res.confirm) return

    this.setData({ deleting: true })
    loading('删除中...')
    try {
      const result = await deleteUnit(id)
      if (result.code !== 0) {
        toast(result.message || '删除失败')
        return
      }
      toast('删除成功', 'success')
      this.loadUnits()
    } catch (err) {
      toast('删除失败')
    } finally {
      this.setData({ deleting: false })
      hideLoading()
    }
  },

  goWords(e) {
    const { id, name, subject } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/words/words?unitId=${encodeURIComponent(id)}&unitName=${encodeURIComponent(name)}&subject=${encodeURIComponent(subject)}`
    })
  }
})
