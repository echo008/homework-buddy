import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './db/index.js'
import { seedPresetData } from './services/presetService.js'

import authRoutes from './routes/auth.js'
import unitRoutes from './routes/units.js'
import wordRoutes from './routes/words.js'
import dictationRoutes from './routes/dictation.js'
import logRoutes from './routes/logs.js'
import classRoutes from './routes/classes.js'
import ocrRoutes from './routes/ocr.js'
import presetRoutes from './routes/preset.js'
import uploadRoutes from './routes/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../')

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 静态文件（上传资源、前端构建产物）
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')))
app.use(express.static(path.join(projectRoot, 'dist')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/units', unitRoutes)
app.use('/api/words', wordRoutes)
app.use('/api/dictation', dictationRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/ocr', ocrRoutes)
app.use('/api/preset', presetRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { timestamp: Date.now() } })
})

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(projectRoot, 'dist', 'index.html'), err => {
    if (err) res.status(404).send('Not found')
  })
})

// 初始化预置数据
seedPresetData()

app.listen(PORT, () => {
  console.log(`\n🚀 智听服务器已启动: http://localhost:${PORT}`)
  console.log(`📖 API 文档: http://localhost:${PORT}/api/health`)
  console.log(`💾 数据库: SQLite (${db.name})\n`)
})

export default app
