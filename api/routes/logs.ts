import { Router } from 'express'
import { saveLog, listLogs, getLog, deleteLog, getWrongWords } from '../services/logService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError, fail } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { limit } = req.query
    const validLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
    const result = listLogs(req.userId, validLimit)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取日志列表失败'))
  }
})

router.get('/wrong-words', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { limit } = req.query
    const validLimit = Math.min(Math.max(Number(limit) || 50, 1), 100)
    const result = getWrongWords(req.userId, validLimit)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取错词列表失败'))
  }
})

router.get('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少日志ID'))
    const result = getLog(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取日志详情失败'))
  }
})

router.post('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const result = saveLog(req.body, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '保存日志失败'))
  }
})

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少日志ID'))
    const result = deleteLog(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '删除日志失败'))
  }
})

export default router
