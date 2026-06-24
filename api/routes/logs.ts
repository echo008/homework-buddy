import { Router } from 'express'
import { saveLog, listLogs, getLog, deleteLog, getWrongWords } from '../services/logService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  const { limit } = req.query
  const result = listLogs(req.userId!, Number(limit) || 20)
  res.json(result)
})

router.get('/wrong-words', (req: AuthRequest, res) => {
  const { limit } = req.query
  const result = getWrongWords(req.userId!, Number(limit) || 50)
  res.json(result)
})

router.get('/:id', (req: AuthRequest, res) => {
  const result = getLog(req.params.id, req.userId!)
  res.json(result)
})

router.post('/', (req: AuthRequest, res) => {
  const result = saveLog(req.body, req.userId!)
  res.json(result)
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = deleteLog(req.params.id, req.userId!)
  res.json(result)
})

export default router
