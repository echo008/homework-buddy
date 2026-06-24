import crypto from 'crypto'
import db from '../db/index.js'

export function generateUniqueCode(): string {
  const maxAttempts = 1000
  for (let i = 0; i < maxAttempts; i++) {
    const code = String(crypto.randomInt(100000, 1000000))
    const existing = db.prepare('SELECT id FROM classes WHERE code = ?').get(code)
    if (!existing) return code
  }
  throw new Error('无法生成唯一班级码，请重试')
}
