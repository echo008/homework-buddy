import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { parseImage } from '../services/ocrService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError, fail } from '../utils/response.js'
import { ALLOWED_SUBJECTS } from '../../shared/constants.js'
import type { Subject } from '../../shared/types.js'

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

router.post('/parse', upload.single('image'), async (req: AuthRequest, res) => {
  let filePath: string | undefined
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.file) return res.json(paramError('请上传图片'))
    filePath = req.file.path
    const subject = (req.body.subject as string) || 'english'
    if (!ALLOWED_SUBJECTS.includes(subject as Subject)) {
      return res.json(paramError('学科类型不正确'))
    }
    const result = await parseImage(filePath, subject as Subject)
    res.json(result)
  } catch (err: any) {
    console.error('OCR 解析失败:', err)
    res.json(fail('OCR 解析失败: ' + err.message))
  } finally {
    if (filePath) {
      fs.unlink(filePath, () => {})
    }
  }
})

export default router
