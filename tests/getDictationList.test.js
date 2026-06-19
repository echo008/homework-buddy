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

  test('缺少单词时应返回提示', async () => {
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
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.unitId === 'u1') })

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 1, max: 10 },
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
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.lesson === 2) })

    const res = await getDictationList.main({
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
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.unitId === 'u1') })

    const res = await getDictationList.main({
      unitIds: ['u1'],
      subject: 'english',
      wordCountRange: { min: 1, max: 10 },
      mode: 'cn2en'
    })

    expect(res.code).toBe(0)
    expect(res.data.words[0].promptType).toBe('chinese')
    expect(res.data.words[0].answerType).toBe('english')
  })

  test('pinyin2hanzi 模式适用于语文', async () => {
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.subject === 'chinese') })

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
    db.get.mockResolvedValueOnce({ data: allWords.filter(w => w.unitId === 'u1') })

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
