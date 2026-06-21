// tests/wordManage.test.js
const wordManage = require('../miniprogram/cloudfunctions/wordManage/index.js')

function createMockDb(overrides = {}) {
  const getQueue = []
  const countQueue = []
  const docGetQueue = []
  const updates = []
  const adds = []
  const removes = []

  const chain = {
    where: jest.fn(() => chain),
    field: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    get: jest.fn(() => {
      const next = getQueue.shift()
      return Promise.resolve(next !== undefined ? next : { data: [] })
    }),
    count: jest.fn(() => {
      const next = countQueue.shift()
      return Promise.resolve(next !== undefined ? next : { total: 0 })
    }),
    doc: jest.fn(() => ({
      get: jest.fn(() => {
        const next = docGetQueue.shift()
        return Promise.resolve(next !== undefined ? next : { data: null })
      }),
      update: jest.fn((payload) => {
        updates.push(payload)
        return Promise.resolve({})
      }),
      remove: jest.fn(() => {
        removes.push(true)
        return Promise.resolve({})
      })
    })),
    add: jest.fn((payload) => {
      adds.push(payload)
      return Promise.resolve({ _id: 'new_word_id' })
    })
  }

  const db = {
    collection: jest.fn(() => chain),
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: null })),
      update: jest.fn(() => Promise.resolve({})),
      remove: jest.fn(() => Promise.resolve({}))
    })),
    command: {
      neq: jest.fn((val) => ({ $neq: val })),
      in: jest.fn((arr) => ({ $in: arr })),
      or: jest.fn((cond) => ({ $or: cond }))
    }
  }

  return {
    db,
    chain,
    queues: { getQueue, countQueue, docGetQueue },
    sideEffects: { updates, adds, removes },
    ...overrides
  }
}

describe('wordManage 单词管理', () => {
  describe('createWord', () => {
    test('缺少必填字段应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await wordManage._createWord({}, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('非单元创建者不能添加单词', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'other_openid', subject: 'english' } })

      const res = await wordManage._createWord({ word: 'apple', meaning: '苹果', unitId: 'u1' }, 'openid', db)
      expect(res.code).toBe(5)
    })

    test('学科不一致应被拒绝', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid', subject: 'chinese' } })

      const res = await wordManage._createWord({ word: 'apple', meaning: '苹果', unitId: 'u1', subject: 'english' }, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('重复单词应被拒绝', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid', subject: 'english' } })
      queues.countQueue.push({ total: 1 })

      const res = await wordManage._createWord({ word: 'apple', meaning: '苹果', unitId: 'u1' }, 'openid', db)
      expect(res.code).toBe(3)
    })

    test('创建成功并同步单元词数', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid', subject: 'english' } })
      queues.countQueue.push({ total: 0 }, { total: 5 })

      const res = await wordManage._createWord({ word: 'apple', meaning: '苹果', unitId: 'u1' }, 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.word).toBe('apple')
      expect(sideEffects.adds.length).toBe(1)
      expect(sideEffects.updates.length).toBe(1)
    })
  })

  describe('updateWord', () => {
    test('无权修改他人单词', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'w1', createdBy: 'other_openid', unitId: 'u1', subject: 'english', word: 'apple' } })

      const res = await wordManage._updateWord({ _id: 'w1', meaning: '新的意思' }, 'openid', db)
      expect(res.code).toBe(5)
    })

    test('移动到他人单元应被拒绝', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'w1', createdBy: 'openid', unitId: 'u1', subject: 'english', word: 'apple' } },
        { data: { _id: 'u2', createdBy: 'other_openid', subject: 'english' } }
      )

      const res = await wordManage._updateWord({ _id: 'w1', unitId: 'u2' }, 'openid', db)
      expect(res.code).toBe(5)
    })

    test('更新成功', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'w1', createdBy: 'openid', unitId: 'u1', subject: 'english', word: 'apple' } },
        { data: { _id: 'w1', createdBy: 'openid', unitId: 'u1', subject: 'english', word: 'apple' } }
      )
      queues.countQueue.push({ total: 0 }, { total: 3 })

      const res = await wordManage._updateWord({ _id: 'w1', meaning: '新的意思' }, 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.updates.length).toBe(2) // 单词更新 + 单元词数同步
    })
  })

  describe('deleteWord', () => {
    test('删除成功并同步词数', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'w1', createdBy: 'openid', unitId: 'u1', word: 'apple' } })
      queues.countQueue.push({ total: 2 })

      const res = await wordManage._deleteWord('w1', 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.removes.length).toBe(1)
      expect(sideEffects.updates.length).toBe(1)
    })
  })
})
