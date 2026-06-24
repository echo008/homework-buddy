import { Router } from 'express'
import { listFilters, listTextbooks, listPresetUnits, previewPresetWords, importPresetUnits } from '../services/presetService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError, fail } from '../utils/response.js'

const router = Router()

router.get('/filters', (_req, res) => {
  try {
    res.json(listFilters())
  } catch (err: any) {
    res.json(fail(err.message || '获取筛选条件失败'))
  }
})

router.get('/textbooks', (req, res) => {
  try {
    const { gradeLevel, subject, version } = req.query
    const result = listTextbooks(gradeLevel as string, subject as string, version as string)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取教材列表失败'))
  }
})

router.get('/units', (req, res) => {
  try {
    const { textbookId, contentType } = req.query
    if (!textbookId) return res.json(paramError('缺少教材ID'))
    const result = listPresetUnits(textbookId as string, contentType as string)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取预置单元失败'))
  }
})

router.get('/units/:id/words', (req, res) => {
  try {
    if (!req.params.id) return res.json(paramError('缺少单元ID'))
    const { limit } = req.query
    const validLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
    const result = previewPresetWords(req.params.id, validLimit)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '预览单词失败'))
  }
})

router.post('/import', authMiddleware, (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { presetUnitIds } = req.body
    if (!Array.isArray(presetUnitIds)) return res.json(paramError('presetUnitIds必须是数组'))
    const result = importPresetUnits(presetUnitIds, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '导入预置单元失败'))
  }
})

export default router
