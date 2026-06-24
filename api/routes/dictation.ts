import { Router } from 'express'
import { startDictation } from '../services/dictationService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.post('/start', (req: AuthRequest, res) => {
  const result = startDictation(req.body, req.userId!)
  res.json(result)
})

export default router
