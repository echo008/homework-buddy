import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { noPermission } from '../utils/response.js'

const JWT_SECRET = process.env.JWT_SECRET || 'smart-dictation-dev-secret'

export interface AuthRequest extends Request {
  userId?: string
  username?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(noPermission('未登录，请先登录'))
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string; username?: string }
    if (!payload.userId) {
      return res.status(401).json(noPermission('登录已过期，请重新登录'))
    }
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    return res.status(401).json(noPermission('登录已过期，请重新登录'))
  }
}

export function signToken(payload: { userId: string; username: string }): string {
  return (jwt as any).sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}
