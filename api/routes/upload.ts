import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import db from '../db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../')
const audioDir = path.join(projectRoot, 'uploads/audio')
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, audioDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm'
    cb(null, uuidv4() + ext)
  }
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()
router.use(authMiddleware)

router.post('/audio', upload.single('audio'), (req: AuthRequest, res) => {
  if (!req.file) return res.json({ code: 2, message: '请上传音频文件' })
  const { wordId } = req.body
  const audioUrl = `/uploads/audio/${req.file.filename}`

  if (wordId) {
    // 校验单词归属
    const word = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as any
    if (word && word.created_by === req.userId) {
      db.prepare('UPDATE words SET audio_url = ? WHERE id = ?').run(audioUrl, wordId)
    }
  }

  res.json({ code: 0, message: '上传成功', data: { audioUrl } })
})

export default router
