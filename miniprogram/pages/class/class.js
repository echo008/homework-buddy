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
const { SUBJECTS, SUBJECT_LABELS } = require('../../utils/constants.js')
const { toast, loading, hideLoading, modal } = require('../../utils/ui.js')

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
      subject: SUBJECTS.ENGLISH
    },
    subjectTabs: [
      { key: SUBJECTS.ENGLISH, label: SUBJECT_LABELS[SUBJECTS.ENGLISH] },
      { key: SUBJECTS.CHINESE, label: SUBJECT_LABELS[SUBJECTS.CHINESE] }
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
    this._classReqSeq = 0
    this._detailReqSeq = 0

    // 处理分享卡片进入：携带 joinCode 时自动填充
    const joinCode = options && options.joinCode ? options.joinCode.trim() : ''
    if (joinCode) {
      this.setData({ joinCode })
      // 延迟弹窗，避免页面未渲染完成时弹窗打断用户
      setTimeout(() => {
        if (!this._isUnloaded) {
          modal('加入班级', `检测到班级码「${joinCode}」，是否立即加入？`, {
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
    let promise
    if (this.data.view === 'list') {
      promise = this.loadClasses()
    } else if (this.data.currentClass) {
      promise = this.loadClassDetail(this.data.currentClass._id)
    } else {
      wx.stopPullDownRefresh()
      return
    }
    promise.then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  async loadClasses() {
    const seq = ++this._classReqSeq
    this.setData({ loading: true })
    try {
      const res = await getMyClasses()
      if (seq !== this._classReqSeq) return
      if (res.code === 0) {
        this.setData({ classes: res.data || [] })
      } else {
        toast(res.message || '加载失败')
      }
    } catch (err) {
      if (seq !== this._classReqSeq) return
      toast('班级加载失败')
    } finally {
      if (seq === this._classReqSeq) {
        this.setData({ loading: false })
      }
    }
  },

  // ========== 创建班级 ==========
  openCreateModal() {
    this.setData({
      showCreateModal: true,
      createForm: { name: '', subject: SUBJECTS.ENGLISH }
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
    if (this.data.creating) return
    const { createForm } = this.data
    if (!createForm.name.trim()) {
      toast('班级名称不能为空')
      return
    }

    this.setData({ creating: true })
    loading('创建中...')

    try {
      const res = await createClass(createForm.name.trim(), createForm.subject)
      if (res.code !== 0) {
        toast(res.message || '创建失败')
        return
      }
      toast('创建成功', 'success')
      this.closeCreateModal()
      this.loadClasses()
    } catch (err) {
      toast('创建失败')
    } finally {
      this.setData({ creating: false })
      hideLoading()
    }
  },

  // ========== 加入班级 ==========
  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value })
  },

  async submitJoin() {
    if (this.data.joining) return
    const { joinCode } = this.data
    if (!joinCode.trim()) {
      toast('请输入班级码')
      return
    }

    this.setData({ joining: true })
    loading('加入中...')

    try {
      const res = await joinClass(joinCode.trim())
      if (res.code !== 0) {
        toast(res.message || '加入失败')
        return
      }
      toast('加入成功', 'success')
      this.setData({ joinCode: '' })
      this.loadClasses()
    } catch (err) {
      toast('加入失败')
    } finally {
      this.setData({ joining: false })
      hideLoading()
    }
  },

  // ========== 班级详情 ==========
  enterClass(e) {
    // 仅传 _id，避免 dataset 序列化大对象（members 数组等）丢失数据
    const classId = e.currentTarget.dataset.id
    if (!classId || this.data.detailLoading) return
    this.setData({ view: 'detail' })
    this.loadClassDetail(classId)
  },

  backToList() {
    this.setData({ view: 'list', currentClass: null, isCreator: false })
    this.loadClasses()
  },

  async loadClassDetail(classId) {
    const seq = ++this._detailReqSeq
    this.setData({ detailLoading: true })
    try {
      const res = await getClassDetail(classId)
      if (seq !== this._detailReqSeq) return
      if (res.code === 0) {
        this.setData({
          currentClass: res.data,
          isCreator: !!res.data.isCreator
        })
      } else {
        // 班级不存在或无权限时，清空当前班级并返回列表
        toast(res.message || '班级不存在')
        this.setData({ currentClass: null })
        setTimeout(() => this.backToList(), 1500)
      }
    } catch (err) {
      if (seq !== this._detailReqSeq) return
      toast('加载失败')
    } finally {
      if (seq === this._detailReqSeq) {
        this.setData({ detailLoading: false })
      }
    }
  },

  async copyCode() {
    const code = this.data.currentClass && this.data.currentClass.code
    if (!code) return
    try {
      await wx.setClipboardData({ data: code })
      toast('班级码已复制', 'success')
    } catch (err) {
      toast('复制失败')
    }
  },

  // 退出班级
  async onLeaveClass() {
    const { currentClass, leaving } = this.data
    if (!currentClass || leaving) return

    const res = await modal('确认退出', `退出班级「${currentClass.name}」后将无法查看共享词库，确定吗？`, { confirmColor: '#ef4444' })
    if (!res.confirm) return

    this.setData({ leaving: true })
    loading('退出中...')
    try {
      const result = await leaveClass(currentClass._id)
      if (result.code !== 0) {
        toast(result.message || '退出失败')
        return
      }
      toast('已退出班级', 'success')
      this.backToList()
    } catch (err) {
      toast('退出失败')
    } finally {
      this.setData({ leaving: false })
      hideLoading()
    }
  },

  // 取消共享
  async onUnshare(e) {
    const unitId = e.currentTarget.dataset.id
    const { currentClass, unsharing } = this.data
    if (!currentClass || unsharing) return

    const res = await modal('确认取消共享', '取消后班级成员将无法看到该单元，确定吗？', { confirmColor: '#ef4444' })
    if (!res.confirm) return

    this.setData({ unsharing: true })
    loading('操作中...')
    try {
      const result = await unshareUnitFromClass(currentClass._id, unitId)
      if (result.code !== 0) {
        toast(result.message || '操作失败')
        return
      }
      toast('已取消共享', 'success')
      this.loadClassDetail(currentClass._id)
    } catch (err) {
      toast('操作失败')
    } finally {
      this.setData({ unsharing: false })
      hideLoading()
    }
  },

  // 去听写：跳转首页并带上学科
  goDictation() {
    const { currentClass } = this.data
    if (!currentClass) return
    wx.reLaunch({ url: `/pages/index/index?subject=${encodeURIComponent(currentClass.subject)}` })
  },

  // 解散班级（仅创建者）
  async onDismissClass() {
    const { currentClass, dismissing } = this.data
    if (!currentClass || dismissing) return

    const res = await modal('确认解散班级', `解散班级「${currentClass.name}」后，所有成员将无法再访问共享词库，且无法恢复，确定吗？`, { confirmText: '解散', confirmColor: '#ef4444' })
    if (!res.confirm) return

    this.setData({ dismissing: true })
    loading('解散中...')
    try {
      const result = await dismissClass(currentClass._id)
      if (result.code !== 0) {
        toast(result.message || '解散失败')
        return
      }
      toast('班级已解散', 'success')
      this.backToList()
    } catch (err) {
      toast('解散失败')
    } finally {
      this.setData({ dismissing: false })
      hideLoading()
    }
  },

  // ========== 共享单元 ==========
  async openShareModal() {
    const { currentClass } = this.data
    if (!currentClass) return

    this.setData({ showShareModal: true, selectedShareUnitId: '', sharing: false })
    loading('加载单元...')

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
        if (myOwnUnits.length === 0) {
          toast('暂无可共享单元，请先创建')
        }
      } else {
        toast(res.message || '加载失败')
      }
    } catch (err) {
      toast('单元加载失败')
    } finally {
      hideLoading()
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
    if (this.data.sharing) return
    const { currentClass, selectedShareUnitId } = this.data
    if (!selectedShareUnitId) {
      toast('请选择一个单元')
      return
    }

    this.setData({ sharing: true })
    loading('共享中...')

    try {
      const res = await shareUnitToClass(currentClass._id, selectedShareUnitId)
      if (res.code !== 0) {
        toast(res.message || '加载失败')
        return
      }
      toast('共享成功', 'success')
      this.closeShareModal()
      this.loadClassDetail(currentClass._id)
    } catch (err) {
      toast('共享失败')
    } finally {
      this.setData({ sharing: false })
      hideLoading()
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
