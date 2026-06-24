import { Router } from 'express'
import { createClass, joinClass, getClassDetail, getMyClasses, shareUnit, unshareUnit, leaveClass, dismissClass } from '../services/classService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  const result = getMyClasses(req.userId!)
  res.json(result)
})

router.post('/', (req: AuthRequest, res) => {
  const { name, subject } = req.body
  if (!name || !subject) return res.json(paramError('班级名称和学科不能为空'))
  const result = createClass(name, subject, req.userId!)
  res.json(result)
})

router.post('/join', (req: AuthRequest, res) => {
  const { code } = req.body
  const result = joinClass(code, req.userId!)
  res.json(result)
})

router.get('/:id', (req: AuthRequest, res) => {
  const result = getClassDetail(req.params.id, req.userId!)
  res.json(result)
})

router.post('/:id/share', (req: AuthRequest, res) => {
  const { unitId } = req.body
  const result = shareUnit(req.params.id, unitId, req.userId!)
  res.json(result)
})

router.post('/:id/unshare', (req: AuthRequest, res) => {
  const { unitId } = req.body
  const result = unshareUnit(req.params.id, unitId, req.userId!)
  res.json(result)
})

router.post('/:id/leave', (req: AuthRequest, res) => {
  const result = leaveClass(req.params.id, req.userId!)
  res.json(result)
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = dismissClass(req.params.id, req.userId!)
  res.json(result)
})

export default router
