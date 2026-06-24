import { Router } from 'express'
import { createWord, updateWord, deleteWord, listWords, batchImportWords } from '../services/wordService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  const { unitId } = req.query
  if (!unitId) return res.json(paramError('缺少单元 ID'))
  const result = listWords(unitId as string, req.userId!)
  res.json(result)
})

router.post('/', (req: AuthRequest, res) => {
  const result = createWord(req.body, req.userId!)
  res.json(result)
})

router.post('/batch', (req: AuthRequest, res) => {
  const { words, unitId } = req.body
  const result = batchImportWords(words, unitId, req.userId!)
  res.json(result)
})

router.put('/:id', (req: AuthRequest, res) => {
  const result = updateWord({ ...req.body, id: req.params.id }, req.userId!)
  res.json(result)
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = deleteWord(req.params.id, req.userId!)
  res.json(result)
})

export default router
