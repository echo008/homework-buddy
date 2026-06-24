import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import db from '../db/index.js'
import { paramError, fail, success, notFound, noPermission } from '../utils/response.js'

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

const uploadAudio = upload.single('audio')

router.post('/audio', (req: AuthRequest, res) => {
  uploadAudio(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.json(paramError('文件上传失败: ' + err.message))
      }
      return res.json(fail('文件上传失败'))
    }
    try {
      if (!req.userId) return res.json(noPermission('用户未登录'))
      if (!req.file) return res.json(paramError('请上传音频文件'))
      const { wordId } = req.body
      const audioUrl = `/uploads/audio/${req.file.filename}`

      if (wordId) {
        const word = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as { id: string; created_by: string } | undefined
        if (!word) {
          fs.unlink(req.file.path, () => {})
          return res.json(notFound('单词不存在'))
        }
        if (word.created_by !== req.userId) {
          fs.unlink(req.file.path, () => {})
          return res.json(noPermission('无权操作该单词'))
        }
        db.prepare('UPDATE words SET audio_url = ? WHERE id = ?').run(audioUrl, wordId)
      }

      res.json(success({ audioUrl }, '上传成功'))
    } catch (error: any) {
      if (req.file) {
        fs.unlink(req.file.path, () => {})
      }
      res.json(fail(error.message || '上传失败'))
    }
  })
})

export default router
