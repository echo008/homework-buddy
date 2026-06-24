import db from '../db/index.js'

export function generateUniqueCode(): string {
  let code = ''
  let exists = true
  let attempts = 0
  const maxAttempts = 100
  while (exists && attempts < maxAttempts) {
    code = Math.floor(100000 + Math.random() * 900000).toString()
    const row = db.prepare('SELECT id FROM classes WHERE code = ?').get(code)
    exists = !!row
    attempts++
  }
  if (exists) {
    throw new Error('无法生成唯一班级码，请重试')
  }
  return code
}
