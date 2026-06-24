import { Router } from 'express'
import { createWord, updateWord, deleteWord, listWords, batchImportWords } from '../services/wordService.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { paramError, fail } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { unitId } = req.query
    if (!unitId) return res.json(paramError('缺少单元 ID'))
    const result = listWords(unitId as string, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '获取单词列表失败'))
  }
})

router.post('/', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { unitId, word, meaning } = req.body
    if (!unitId || !word || !meaning) return res.json(paramError('单元ID、单词和释义不能为空'))
    const result = createWord(req.body, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '创建单词失败'))
  }
})

router.post('/batch', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    const { words, unitId } = req.body
    if (!unitId) return res.json(paramError('缺少单元ID'))
    if (!Array.isArray(words)) return res.json(paramError('words必须是数组'))
    const result = batchImportWords(words, unitId, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '批量导入失败'))
  }
})

router.put('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少单词ID'))
    const result = updateWord({ ...req.body, id: req.params.id }, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '更新单词失败'))
  }
})

router.delete('/:id', (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.json(paramError('用户未登录'))
    if (!req.params.id) return res.json(paramError('缺少单词ID'))
    const result = deleteWord(req.params.id, req.userId)
    res.json(result)
  } catch (err: any) {
    res.json(fail(err.message || '删除单词失败'))
  }
})

export default router
