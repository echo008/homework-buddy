// tests/unitManage.test.js
const unitManage = require('../miniprogram/cloudfunctions/unitManage/index.js')

function createMockDb(overrides = {}) {
  const getQueue = []
  const docGetQueue = []
  const updates = []
  const removes = []
  const adds = []

  const chain = {
    where: jest.fn(() => chain),
    field: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    get: jest.fn(() => {
      const next = getQueue.shift()
      const data = Array.isArray(next) ? next : (next ? next.data : [])
      return Promise.resolve({ data })
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
      return Promise.resolve({ _id: 'new_unit_id' })
    })
  }

  const db = {
    collection: jest.fn(() => chain),
    command: {
      or: jest.fn((cond) => ({ $or: cond })),
      in: jest.fn((arr) => ({ $in: arr })),
      pull: jest.fn((val) => ({ $pull: val }))
    }
  }

  return {
    db,
    chain,
    queues: { getQueue, docGetQueue },
    sideEffects: { updates, removes, adds },
    ...overrides
  }
}

describe('unitManage 单元管理', () => {
  describe('createUnit', () => {
    test('缺少单元名称应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await unitManage._createUnit({ subject: 'english' }, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('学科不正确应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await unitManage._createUnit({ name: '单元1', subject: 'math' }, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('创建成功应返回单元数据', async () => {
      const { db, sideEffects } = createMockDb()
      const res = await unitManage._createUnit({
        name: 'Unit 1',
        subject: 'english',
        grade: '三年级',
        order: 1
      }, 'openid', db)

      expect(res.code).toBe(0)
      expect(res.data.name).toBe('Unit 1')
      expect(res.data.subject).toBe('english')
      expect(res.data.createdBy).toBe('openid')
      expect(sideEffects.adds.length).toBe(1)
    })
  })

  describe('updateUnit', () => {
    test('缺少单元 ID 应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await unitManage._updateUnit({ name: '新名称' }, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('无权修改他人单元应被拒绝', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'other_openid', name: '旧名称' } })

      const res = await unitManage._updateUnit({ _id: 'u1', name: '新名称' }, 'openid', db)
      expect(res.code).toBe(5)
    })

    test('学科不正确应返回参数错误', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid', name: '旧名称' } })

      const res = await unitManage._updateUnit({ _id: 'u1', subject: 'history' }, 'openid', db)
      expect(res.code).toBe(2)
    })

    test('更新成功应返回成功状态', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid', name: '旧名称' } })

      const res = await unitManage._updateUnit({ _id: 'u1', name: '新名称', order: 2 }, 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.updates.length).toBe(1)
    })

    test('无有效更新字段应返回提示', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid', name: '旧名称' } })

      const res = await unitManage._updateUnit({ _id: 'u1' }, 'openid', db)
      expect(res.code).toBe(2)
    })
  })

  describe('deleteUnit', () => {
    test('缺少单元 ID 应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await unitManage._deleteUnit('', 'openid', db)
      expect(res.code).toBe(2)
    })

    test('无权删除他人单元应被拒绝', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'other_openid' } })

      const res = await unitManage._deleteUnit('u1', 'openid', db)
      expect(res.code).toBe(5)
    })

    test('删除成功应清理单词和班级共享引用', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'u1', createdBy: 'openid' } })

      // words.get 返回一个单词（data.length < batchLimit，不会再次查询）
      queues.getQueue.push([{ _id: 'w1' }])

      // classes.get 返回两个班级
      queues.getQueue.push([{ _id: 'c1' }, { _id: 'c2' }])

      const res = await unitManage._deleteUnit('u1', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.removedWords).toBe(1)
      expect(sideEffects.removes.length).toBe(2) // 单词删除 + 单元删除
      expect(sideEffects.updates.length).toBe(2) // 两个班级共享列表清理
    })
  })

  describe('listUnits', () => {
    test('按学科过滤并合并班级共享单元', async () => {
      const { db, queues } = createMockDb()

      // myUnits 分页查询：第一页
      queues.getQueue.push([
        { _id: 'u1', name: '我的单元', order: 1, createdBy: 'openid', subject: 'english' }
      ])

      // myClasses 查询
      queues.getQueue.push([
        { _id: 'c1', sharedUnitIds: ['u2', 'u1'] }
      ])

      // sharedUnits 查询：u2 是共享单元
      queues.getQueue.push([
        { _id: 'u2', name: '共享单元', order: 2, createdBy: 'other_openid', subject: 'english' }
      ])

      const res = await unitManage._listUnits('english', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.length).toBe(2)
      expect(res.data.map(u => u._id)).toEqual(['u1', 'u2'])
    })

    test('共享单元与自有单元重复时应去重', async () => {
      const { db, queues } = createMockDb()

      queues.getQueue.push([
        { _id: 'u1', name: '我的单元', order: 1, createdBy: 'openid', subject: 'english' }
      ])
      queues.getQueue.push([
        { _id: 'c1', sharedUnitIds: ['u1'] }
      ])
      queues.getQueue.push([])

      const res = await unitManage._listUnits('english', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.length).toBe(1)
      expect(res.data[0]._id).toBe('u1')
    })
  })
})
