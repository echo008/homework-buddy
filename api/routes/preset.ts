import { Router } from 'express'
import { listFilters, listTextbooks, listPresetUnits, previewPresetWords, importPresetUnits } from '../services/presetService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/filters', (_req, res) => {
  res.json(listFilters())
})

router.get('/textbooks', (req, res) => {
  const { gradeLevel, subject, version } = req.query
  const result = listTextbooks(gradeLevel as string, subject as string, version as string)
  res.json(result)
})

router.get('/units', (req, res) => {
  const { textbookId, contentType } = req.query
  const result = listPresetUnits(textbookId as string, contentType as string)
  res.json(result)
})

router.get('/units/:id/words', (req, res) => {
  const { limit } = req.query
  const result = previewPresetWords(req.params.id, Number(limit) || 20)
  res.json(result)
})

router.post('/import', authMiddleware, (req: AuthRequest, res) => {
  const { presetUnitIds } = req.body
  const result = importPresetUnits(presetUnitIds || [], req.userId!)
  res.json(result)
})

export default router
