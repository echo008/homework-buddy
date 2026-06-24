import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { parseImage } from '../services/ocrService.js'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../')
const uploadDir = path.join(projectRoot, 'uploads/ocr')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext)
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()
router.use(authMiddleware)

router.post('/parse', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.json({ code: 2, message: '请上传图片' })
    const subject = (req.body.subject as string) || 'english'
    const result = await parseImage(req.file.path, subject as any)
    res.json(result)
  } catch (err: any) {
    console.error('OCR 解析失败:', err)
    res.json({ code: -1, message: 'OCR 解析失败: ' + err.message })
  }
})

export default router
