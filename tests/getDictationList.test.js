// tests/getDictationList.test.js
const cloud = require('wx-server-sdk')
const getDictationList = require('../miniprogram/cloudfunctions/getDictationList/index.js')

describe('getDictationList 听写引擎', () => {
  const allWords = [
    { _id: 'w1', word: 'apple', meaning: '苹果', unitId: 'u1', subject: 'english', lesson: 1 },
    { _id: 'w2', word: 'banana', meaning: '香蕉', unitId: 'u1', subject: 'english', lesson: 1 },
    { _id: 'w3', word: 'cat', meaning: '猫', unitId: 'u2', subject: 'english', lesson: 2 },
    { _id: 'w4', word: '鹏', meaning: '大鹏', unitId: 'u3', subject: 'chinese', lesson: 1, pinyin: 'péng' }
  ]

  const db = cloud.database()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('缺少 unitIds 应返回参数错误', async () => {
    const res = await getDictationList.main({
      subject: 'english',
      wordCountRange: { min: 5, max: 10 },
      mode: 'en2cn'
    })

    expect(res.code).toBe(2)
    expect(res.message).toContain('单元')
  })

  test('无权访问的单元应被拒绝', async () => {
    // 权限校验：units 查询返回空（用户无可访问单元），classes 查询返回空
    db.get.mockResolvedValueOnce({ data: [] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 5, max: 10 },
      mode: 'en2cn'
    })

    expect(res.code).toBe(5)
    expect(res.message).toContain('无权访问')
  })

  test('缺少单词时应返回提示', async () => {
    // 权限校验通过：units 包含 u1，classes 为空
    db.get.mockResolvedValueOnce({ data: [{ _id: 'u1', createdBy: 'test_openid' }] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes
    // 题库查询返回空
    db.get.mockResolvedValueOnce({ data: [] })

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 5, max: 10 },
      mode: 'en2cn'
    })

    expect(res.code).toBe(1)
    expect(res.message).toContain('暂无单词')
  })

  test('按单元筛选并组装 en2cn 题目', async () => {
    db.get.mockResolvedValueOnce({ data: [{ _id: 'u1', createdBy: 'test_openid' }] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.unitId === 'u1') }) // words

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 2, max: 2 },
      mode: 'en2cn'
    })

    expect(res.code).toBe(0)
    expect(res.data.words.length).toBe(2)
    expect(res.data.words[0]).toHaveProperty('prompt')
    expect(res.data.words[0]).toHaveProperty('answer')
    expect(res.data.words[0].promptType).toBe('english')
    expect(res.data.words[0].answerType).toBe('chinese')
  })

  test('按课次筛选', async () => {
    db.get.mockResolvedValueOnce({ data: [{ _id: 'u2', createdBy: 'test_openid' }] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.lesson === 2) }) // words

    const res = await getDictationList.main({
      unitIds: ['u2'],
      lessons: [2],
      subject: 'english',
      wordCountRange: { min: 1, max: 10 },
      mode: 'en2cn'
    })

    expect(res.code).toBe(0)
    expect(res.data.words.length).toBe(1)
    expect(res.data.words[0].wordId).toBe('w3')
  })

  test('cn2en 模式题目结构正确', async () => {
    db.get.mockResolvedValueOnce({ data: [{ _id: 'u1', createdBy: 'test_openid' }] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.unitId === 'u1') }) // words

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 1, max: 1 },
      mode: 'cn2en'
    })

    expect(res.code).toBe(0)
    expect(res.data.words[0].promptType).toBe('chinese')
    expect(res.data.words[0].answerType).toBe('english')
  })

  test('pinyin2hanzi 模式适用于语文', async () => {
    db.get.mockResolvedValueOnce({ data: [{ _id: 'u3', createdBy: 'test_openid' }] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.subject === 'chinese') }) // words

    const res = await getDictationList.main({
      unitIds: ['u3'],
      subject: 'chinese',
      wordCountRange: { min: 1, max: 10 },
      mode: 'pinyin2hanzi'
    })

    expect(res.code).toBe(0)
    expect(res.data.words[0].promptType).toBe('pinyin')
    expect(res.data.words[0].answerType).toBe('chinese')
  })

  test('抽题数量不超过题库总量', async () => {
    db.get.mockResolvedValueOnce({ data: [{ _id: 'u1', createdBy: 'test_openid' }] }) // units
    db.get.mockResolvedValueOnce({ data: [] }) // classes
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.unitId === 'u1') }) // words

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 100, max: 200 },
      mode: 'en2cn'
    })

    expect(res.code).toBe(0)
    expect(res.data.words.length).toBeLessThanOrEqual(2)
  })
})
