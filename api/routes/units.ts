import { Router } from 'express'
import { createUnit, updateUnit, deleteUnit, listUnits } from '../services/unitService.js'
import { paramError, fail } from '../utils/response.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { subject } = req.query
    const result = listUnits(subject as string | undefined, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取单元列表失败'))
  }
})

router.post('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { name, subject } = req.body
    if (!name || !subject) return res.json(paramError('单元名称和学科不能为空'))
    const result = createUnit(req.body, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '创建单元失败'))
  }
})

router.put('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少单元ID'))
    const result = updateUnit({ ...req.body, id: req.params.id }, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '更新单元失败'))
  }
})

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少单元ID'))
    const result = deleteUnit(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '删除单元失败'))
  }
})

export default router
