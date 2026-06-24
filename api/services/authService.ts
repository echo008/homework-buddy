import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import db from '../db/index.js'
import { signToken } from '../middleware/auth.js'
import type { User } from '../../shared/types.js'

export function register(username: string, password: string, nickname?: string) {
  if (!username || !username.trim() || !password) {
    return { code: 2, message: '用户名和密码不能为空' }
  }
  const trimmedName = username.trim()
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    return { code: 2, message: '用户名长度应为2-20个字符' }
  }
  if (password.length < 6) {
    return { code: 2, message: '密码长度至少6位' }
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedName)
  if (existing) {
    return { code: 3, message: '用户名已存在' }
  }

  const id = uuidv4()
  const hash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO users (id, username, password_hash, nickname, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, trimmedName, hash, nickname || trimmedName, now)

  const token = signToken({ userId: id, username: trimmedName })
  return {
    code: 0,
    message: '注册成功',
    data: { token, user: { id, username: trimmedName, nickname: nickname || trimmedName, createdAt: now } }
  }
}

export function login(username: string, password: string) {
  if (!username || !username.trim() || !password) {
    return { code: 2, message: '用户名和密码不能为空' }
  }
  const trimmedName = username.trim()
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmedName) as any
  if (!row) {
    return { code: 4, message: '用户名或密码错误' }
  }
  if (!bcrypt.compareSync(password, row.password_hash)) {
    return { code: 4, message: '用户名或密码错误' }
  }

  const token = signToken({ userId: row.id, username: row.username })
  const user: User = {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    createdAt: row.created_at
  }
  return { code: 0, message: '登录成功', data: { token, user } }
}

export function getMe(userId: string) {
  const row = db.prepare('SELECT id, username, nickname, created_at FROM users WHERE id = ?').get(userId) as any
  if (!row) return { code: 4, message: '用户不存在' }
  return {
    code: 0,
    data: { id: row.id, username: row.username, nickname: row.nickname, createdAt: row.created_at }
  }
}
