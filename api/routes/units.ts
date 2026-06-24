import { Router } from 'express'
import { createUnit, updateUnit, deleteUnit, listUnits } from '../services/unitService.js'
import { paramError } from '../utils/response.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  const { subject } = req.query
  const result = listUnits(subject as string | undefined, req.userId!)
  res.json(result)
})

router.post('/', (req: AuthRequest, res) => {
  const result = createUnit(req.body, req.userId!)
  res.json(result)
})

router.put('/:id', (req: AuthRequest, res) => {
  const result = updateUnit({ ...req.body, id: req.params.id }, req.userId!)
  res.json(result)
})

router.delete('/:id', (req: AuthRequest, res) => {
  const result = deleteUnit(req.params.id, req.userId!)
  res.json(result)
})

export default router
