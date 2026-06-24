import { Router } from 'express'
import { register, login, getMe } from '../services/authService.js'
import { success, paramError } from '../utils/response.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body
  if (!username || !password) return res.json(paramError('用户名和密码不能为空'))
  const result = register(username, password, nickname)
  res.json(result)
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.json(paramError('用户名和密码不能为空'))
  const result = login(username, password)
  res.json(result)
})

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const result = getMe(req.userId!)
  res.json(result)
})

export default router
