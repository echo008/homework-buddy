import { Router } from 'express'
import { startDictation } from '../services/dictationService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError, fail } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.post('/start', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { subject, mode, unitIds } = req.body
    if (!subject || !mode || !unitIds) return res.json(paramError('学科、模式和单元ID列表不能为空'))
    if (!Array.isArray(unitIds) || unitIds.length === 0) return res.json(paramError('单元ID列表不能为空'))
    const result = startDictation(req.body, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '开始听写失败'))
  }
})

export default router
