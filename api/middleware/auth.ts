import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { fail } from '../utils/response.js'

const JWT_SECRET = process.env.JWT_SECRET || 'smart-dictation-dev-secret'

export interface AuthRequest extends Request {
  userId?: string
  username?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(fail('未登录，请先登录', 5))
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    return res.status(401).json(fail('登录已过期，请重新登录', 5))
  }
}

export function signToken(payload: { userId: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}
