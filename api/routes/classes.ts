import { Router } from 'express'
import { createClass, joinClass, getClassDetail, getMyClasses, shareUnit, unshareUnit, leaveClass, dismissClass } from '../services/classService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError, fail } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const result = getMyClasses(req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取班级列表失败'))
  }
})

router.post('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { name, subject } = req.body
    if (!name || !subject) return res.json(paramError('班级名称和学科不能为空'))
    const result = createClass(name, subject, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '创建班级失败'))
  }
})

router.post('/join', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { code } = req.body
    if (!code || typeof code !== 'string') return res.json(paramError('班级邀请码不能为空'))
    const result = joinClass(code, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '加入班级失败'))
  }
})

router.get('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少班级ID'))
    const result = getClassDetail(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取班级详情失败'))
  }
})

router.post('/:id/share', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少班级ID'))
    const { unitId } = req.body
    if (!unitId) return res.json(paramError('缺少单元ID'))
    const result = shareUnit(req.params.id, unitId, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '分享单元失败'))
  }
})

router.post('/:id/unshare', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少班级ID'))
    const { unitId } = req.body
    if (!unitId) return res.json(paramError('缺少单元ID'))
    const result = unshareUnit(req.params.id, unitId, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '取消分享失败'))
  }
})

router.post('/:id/leave', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少班级ID'))
    const result = leaveClass(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '退出班级失败'))
  }
})

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少班级ID'))
    const result = dismissClass(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '解散班级失败'))
  }
})

export default router
