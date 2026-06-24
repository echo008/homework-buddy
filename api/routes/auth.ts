import { Router } from 'express'
import { register, login, getMe } from '../services/authService.js'
import { success, paramError, fail, notFound } from '../utils/response.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req, res) => {
  try {
    const { username, password, nickname } = req.body
    if (!username || !password) return res.json(paramError('用户名和密码不能为空'))
    const result = register(username, password, nickname)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '注册失败'))
  }
})

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.json(paramError('用户名和密码不能为空'))
    const result = login(username, password)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '登录失败'))
  }
})

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(notFound('用户未登录'))
    const result = getMe(req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取用户信息失败'))
  }
})

export default router
