// pages/class/class.js - 班级共享页
const {
  getMyClasses,
  createClass,
  joinClass,
  getClassDetail,
  shareUnitToClass,
  unshareUnitFromClass,
  leaveClass,
  dismissClass,
  getManagedUnits
} = require('../../utils/cloudApi.js')

Page({
  data: {
    view: 'list', // list | detail
    classes: [],
    loading: false,

    // 创建班级
    showCreateModal: false,
    creating: false,
    createForm: {
      name: '',
      subject: 'english'
    },
    subjectTabs: [
      { key: 'english', label: '英语' },
      { key: 'chinese', label: '语文' }
    ],

    // 加入班级
    joinCode: '',
    joining: false,

    // 班级详情
    currentClass: null,
    detailLoading: false,
    isCreator: false,
    leaving: false,
    dismissing: false,
    unsharing: false,

    // 共享单元
    showShareModal: false,
    myUnits: [],
    selectedShareUnitId: '',
    sharing: false
  },

  onLoad(options) {
    // 由 onShow 统一加载班级列表，避免 onLoad + onShow 重复请求

    // 处理分享卡片进入：携带 joinCode 时自动填充
    const joinCode = options && options.joinCode ? options.joinCode.trim() : ''
    if (joinCode) {
      this.setData({ joinCode })
      // 延迟弹窗，避免页面未渲染完成时弹窗打断用户
      setTimeout(() => {
        if (!this._isUnloaded) {
          wx.showModal({
            title: '加入班级',
            content: `检测到班级码「${joinCode}」，是否立即加入？`,
            confirmText: '立即加入',
            success: (res) => {
              if (res.confirm) {
                this.submitJoin()
              }
            }
          })
        }
      }, 500)
    }
  },

  onShow() {
    if (this.data.view === 'list') {
      this.loadClasses()
    } else if (this.data.currentClass) {
      this.loadClassDetail(this.data.currentClass._id)
    }
  },

  onUnload() {
    this._isUnloaded = true
  },

  onPullDownRefresh() {
    if (this.data.view === 'list') {
      this.loadClasses().then(() => wx.stopPullDownRefresh())
    } else if (this.data.currentClass) {
      this.loadClassDetail(this.data.currentClass._id).then(() => wx.stopPullDownRefresh())
    } else {
      wx.stopPullDownRefresh()
    }
  },

  async loadClasses() {
    this.setData({ loading: true })
    try {
      const res = await getMyClasses()
      if (res.code === 0) {
        this.setData({ classes: res.data || [] })
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '班级加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ========== 创建班级 ==========
  openCreateModal() {
    this.setData({
      showCreateModal: true,
      createForm: { name: '', subject: 'english' }
    })
  },

  closeCreateModal() {
    this.setData({ showCreateModal: false })
  },

  onCreateInput(e) {
    this.setData({ 'createForm.name': e.detail.value })
  },

  onCreateSubjectChange(e) {
    const subject = e.currentTarget.dataset.key
    this.setData({ 'createForm.subject': subject })
  },

  async submitCreate() {
    const { createForm } = this.data
    if (!createForm.name.trim()) {
      wx.showToast({ title: '班级名称不能为空', icon: 'none' })
      return
    }

    this.setData({ creating: true })
    wx.showLoading({ title: '创建中...' })

    try {
      const res = await createClass(createForm.name.trim(), createForm.subject)
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '创建失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '创建成功', icon: 'success' })
      this.closeCreateModal()
      this.loadClasses()
    } catch (err) {
      wx.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      this.setData({ creating: false })
      wx.hideLoading()
    }
  },

  // ========== 加入班级 ==========
  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value })
  },

  async submitJoin() {
    const { joinCode } = this.data
    if (!joinCode.trim()) {
      wx.showToast({ title: '请输入班级码', icon: 'none' })
      return
    }

    this.setData({ joining: true })
    wx.showLoading({ title: '加入中...' })

    try {
      const res = await joinClass(joinCode.trim())
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '加入失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '加入成功', icon: 'success' })
      this.setData({ joinCode: '' })
      this.loadClasses()
    } catch (err) {
      wx.showToast({ title: '加入失败', icon: 'none' })
    } finally {
      this.setData({ joining: false })
      wx.hideLoading()
    }
  },

  // ========== 班级详情 ==========
  enterClass(e) {
    // 仅传 _id，避免 dataset 序列化大对象（members 数组等）丢失数据
    const classId = e.currentTarget.dataset.id
    if (!classId) return
    this.setData({ view: 'detail' })
    this.loadClassDetail(classId)
  },

  backToList() {
    this.setData({ view: 'list', currentClass: null, isCreator: false })
    this.loadClasses()
  },

  async loadClassDetail(classId) {
    this.setData({ detailLoading: true })
    try {
      const res = await getClassDetail(classId)
      if (res.code === 0) {
        this.setData({
          currentClass: res.data,
          isCreator: !!res.data.isCreator
        })
      } else {
        // 班级不存在或无权限时，清空当前班级并返回列表
        wx.showToast({ title: res.message || '班级不存在', icon: 'none' })
        this.setData({ currentClass: null })
        setTimeout(() => this.backToList(), 1500)
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ detailLoading: false })
    }
  },

  async copyCode() {
    const code = this.data.currentClass && this.data.currentClass.code
    if (!code) return
    try {
      await wx.setClipboardData({ data: code })
      wx.showToast({ title: '班级码已复制', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: '复制失败', icon: 'none' })
    }
  },

  // 退出班级
  async onLeaveClass() {
    const { currentClass, leaving } = this.data
    if (!currentClass || leaving) return

    const res = await wx.showModal({
      title: '确认退出',
      content: `退出班级「${currentClass.name}」后将无法查看共享词库，确定吗？`,
      confirmColor: '#ef4444'
    })
    if (!res.confirm) return

    this.setData({ leaving: true })
    wx.showLoading({ title: '退出中...' })
    try {
      const result = await leaveClass(currentClass._id)
      if (result.code !== 0) {
        wx.showToast({ title: result.message || '退出失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '已退出班级', icon: 'success' })
      this.backToList()
    } catch (err) {
      wx.showToast({ title: '退出失败', icon: 'none' })
    } finally {
      this.setData({ leaving: false })
      wx.hideLoading()
    }
  },

  // 取消共享
  async onUnshare(e) {
    const unitId = e.currentTarget.dataset.id
    const { currentClass, unsharing } = this.data
    if (!currentClass || unsharing) return

    const res = await wx.showModal({
      title: '确认取消共享',
      content: '取消后班级成员将无法看到该单元，确定吗？',
      confirmColor: '#ef4444'
    })
    if (!res.confirm) return

    this.setData({ unsharing: true })
    wx.showLoading({ title: '操作中...' })
    try {
      const result = await unshareUnitFromClass(currentClass._id, unitId)
      if (result.code !== 0) {
        wx.showToast({ title: result.message || '操作失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '已取消共享', icon: 'success' })
      this.loadClassDetail(currentClass._id)
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      this.setData({ unsharing: false })
      wx.hideLoading()
    }
  },

  // 去听写：跳转首页并带上学科
  goDictation() {
    const { currentClass } = this.data
    if (!currentClass) return
    wx.reLaunch({ url: `/pages/index/index?subject=${currentClass.subject}` })
  },

  // 解散班级（仅创建者）
  async onDismissClass() {
    const { currentClass, dismissing } = this.data
    if (!currentClass || dismissing) return

    const res = await wx.showModal({
      title: '确认解散班级',
      content: `解散班级「${currentClass.name}」后，所有成员将无法再访问共享词库，且无法恢复，确定吗？`,
      confirmText: '解散',
      confirmColor: '#ef4444'
    })
    if (!res.confirm) return

    this.setData({ dismissing: true })
    wx.showLoading({ title: '解散中...' })
    try {
      const result = await dismissClass(currentClass._id)
      if (result.code !== 0) {
        wx.showToast({ title: result.message || '解散失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '班级已解散', icon: 'success' })
      this.backToList()
    } catch (err) {
      wx.showToast({ title: '解散失败', icon: 'none' })
    } finally {
      this.setData({ dismissing: false })
      wx.hideLoading()
    }
  },

  // ========== 共享单元 ==========
  async openShareModal() {
    const { currentClass } = this.data
    if (!currentClass) return

    this.setData({ showShareModal: true, selectedShareUnitId: '', sharing: false })
    wx.showLoading({ title: '加载单元...' })

    try {
      const res = await getManagedUnits(currentClass.subject)
      if (res.code === 0) {
        const app = getApp()
        let openid = app.globalData.openid
        if (!openid) {
          try {
            openid = await app.ensureOpenid()
          } catch (err) {
            console.error('获取 openid 失败:', err)
          }
        }
        // 仅显示当前用户自己创建的单元（共享单元无法再次共享，避免误选报错）
        const myOwnUnits = (res.data || []).filter(u => u.createdBy === openid)
        this.setData({ myUnits: myOwnUnits })
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '单元加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  closeShareModal() {
    this.setData({ showShareModal: false, selectedShareUnitId: '' })
  },

  selectShareUnit(e) {
    const unitId = e.currentTarget.dataset.id
    this.setData({ selectedShareUnitId: unitId })
  },

  async submitShare() {
    const { currentClass, selectedShareUnitId } = this.data
    if (!selectedShareUnitId) {
      wx.showToast({ title: '请选择一个单元', icon: 'none' })
      return
    }

    this.setData({ sharing: true })
    wx.showLoading({ title: '共享中...' })

    try {
      const res = await shareUnitToClass(currentClass._id, selectedShareUnitId)
      if (res.code !== 0) {
        wx.showToast({ title: res.message || '共享失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '共享成功', icon: 'success' })
      this.closeShareModal()
      this.loadClassDetail(currentClass._id)
    } catch (err) {
      wx.showToast({ title: '共享失败', icon: 'none' })
    } finally {
      this.setData({ sharing: false })
      wx.hideLoading()
    }
  },

  onShareAppMessage() {
    const cls = this.data.currentClass
    if (cls) {
      return {
        title: `加入班级「${cls.name}」，一起听写吧！班级码：${cls.code}`,
        path: `/pages/class/class?joinCode=${cls.code}`
      }
    }
    return {
      title: 'Homework Buddy · 智听 - 一起听写',
      path: '/pages/index/index'
    }
  }
})
