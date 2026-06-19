// pages/units/units.js - 单元管理页
const { getManagedUnits, saveUnit, deleteUnit } = require('../../utils/cloudApi.js')

Page({
  data: {
    subject: 'english',
    subjectTabs: [
      { key: 'english', label: '英语' },
      { key: 'chinese', label: '语文' }
    ],
    units: [],
    loading: false,
    showModal: false,
    editing: false,
    submitting: false,
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
    this.loadUnits()
  },

  onShow() {
    this.loadUnits()
  },

  onSubjectChange(e) {
    const subject = e.currentTarget.dataset.key
    this.setData({ subject })
    this.loadUnits()
  },

  async loadUnits() {
    this.setData({ loading: true })
    try {
      const res = await getManagedUnits(this.data.subject)
      if (res.code === 0) {
        this.setData({ units: res.data || [] })
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '单元加载失败', icon: 'none' })
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
        name: '',
        grade: '',
        semester: '',
        textbook: '',
        order: 0
      }
    })
  },

  onEdit(e) {
    const unit = e.currentTarget.dataset.unit
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
    const { form, subject, editing } = this.data
    if (!form.name || !form.name.trim()) {
      wx.showToast({ title: '单元名称不能为空', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: editing ? '保存中...' : '创建中...' })

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
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
        return
      }
      wx.showToast({ title: editing ? '保存成功' : '创建成功', icon: 'success' })
      this.onHideModal()
      this.loadUnits()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
      wx.hideLoading()
    }
  },

  async onDelete(e) {
    const { id, name } = e.currentTarget.dataset
    const res = await wx.showModal({
      title: '确认删除',
      content: `删除单元「${name}」将同时删除其下所有单词，确定吗？`,
      confirmColor: '#ef4444'
    })
    if (!res.confirm) return

    wx.showLoading({ title: '删除中...' })
    try {
      const result = await deleteUnit(id)
      if (result.code !== 0) {
        wx.showToast({ title: result.message || '删除失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '删除成功', icon: 'success' })
      this.loadUnits()
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  goWords(e) {
    const { id, name, subject } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/words/words?unitId=${id}&unitName=${encodeURIComponent(name)}&subject=${subject}`
    })
  }
})
