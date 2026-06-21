// tests/logManage.test.js
const logManage = require('../miniprogram/cloudfunctions/logManage/index.js')

function createMockDb() {
  const getQueue = []
  const adds = []

  const chain = {
    where: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    get: jest.fn(() => {
      const next = getQueue.shift()
      return Promise.resolve(next !== undefined ? next : { data: [] })
    }),
    add: jest.fn((payload) => {
      adds.push(payload)
      return Promise.resolve({ _id: 'log_id' })
    })
  }

  const db = {
    collection: jest.fn(() => chain)
  }

  return { db, chain, getQueue, adds }
}

describe('logManage 听写记录', () => {
  describe('saveLog', () => {
    test('参数校验失败应返回错误', async () => {
      const { db } = createMockDb()
      const res = await logManage._saveLog({ subject: 'invalid' }, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('保存成功并补齐默认值', async () => {
      const { db, adds } = createMockDb()
      const log = {
        subject: 'english',
        mode: 'en2cn',
        wordCountRange: { min: 5, max: 10 },
        totalWords: 10,
        correctCount: 8,
        wrongCount: 2,
        accuracy: 80,
        wrongWords: [{ wordId: 'w1', isCorrect: false }],
        questions: [{ wordId: 'w1' }]
      }

      const res = await logManage._saveLog(log, 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.openid).toBe('openid')
      expect(res.data.accuracy).toBe(80)
      expect(adds.length).toBe(1)
    })
  })

  describe('listLogs', () => {
    test('应按 openid 分页查询', async () => {
      const { db, getQueue } = createMockDb()
      getQueue.push({ data: [{ _id: 'l1' }, { _id: 'l2' }] }, { data: [] })

      const res = await logManage._listLogs('openid', 5, db)
      expect(res.code).toBe(0)
      expect(res.data.length).toBe(2)
    })

    test('limit 超过 100 应截断', async () => {
      const { db, getQueue } = createMockDb()
      getQueue.push({ data: Array(100).fill({ _id: 'l' }) }, { data: [] })

      const res = await logManage._listLogs('openid', 200, db)
      expect(res.code).toBe(0)
      expect(res.data.length).toBe(100)
    })
  })
})
