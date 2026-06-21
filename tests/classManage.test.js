// tests/classManage.test.js
const classManage = require('../miniprogram/cloudfunctions/classManage/index.js')

function createMockDb(overrides = {}) {
  const getQueue = []
  const docGetQueue = []
  const countQueue = []
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
      return Promise.resolve({ _id: 'new_class_id' })
    })
  }

  const db = {
    collection: jest.fn(() => chain),
    command: {
      push: jest.fn((val) => ({ $push: val })),
      pull: jest.fn((val) => ({ $pull: val })),
      or: jest.fn((cond) => ({ $or: cond })),
      in: jest.fn((arr) => ({ $in: arr }))
    }
  }

  return {
    db,
    chain,
    queues: { getQueue, docGetQueue, countQueue },
    sideEffects: { updates, removes, adds },
    ...overrides
  }
}

describe('classManage 班级管理', () => {
  describe('createClass', () => {
    test('缺少班级名称应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await classManage._createClass('', 'english', 'openid', db)
      expect(res.code).toBe(2)
    })

    test('学科不正确应返回参数错误', async () => {
      const { db } = createMockDb()
      const res = await classManage._createClass('班级1', 'history', 'openid', db)
      expect(res.code).toBe(2)
    })

    test('创建成功应返回班级数据', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.countQueue.push({ total: 0 })

      const res = await classManage._createClass('班级1', 'english', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.name).toBe('班级1')
      expect(res.data.createdBy).toBe('openid')
      expect(res.data.members).toContain('openid')
      expect(sideEffects.adds.length).toBe(1)
    })
  })

  describe('joinClass', () => {
    test('班级码不存在应返回错误', async () => {
      const { db, queues } = createMockDb()
      queues.getQueue.push([])

      const res = await classManage._joinClass('000000', 'openid', db)
      expect(res.code).toBe(3)
    })

    test('已在班级中应返回提示', async () => {
      const { db, queues } = createMockDb()
      queues.getQueue.push([{ _id: 'c1', members: ['openid'] }])

      const res = await classManage._joinClass('123456', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.message).toBe('你已在班级中')
    })

    test('班级人数已满应被拒绝', async () => {
      const { db, queues } = createMockDb()
      queues.getQueue.push([{ _id: 'c1', members: new Array(200).fill('x') }])

      const res = await classManage._joinClass('123456', 'openid', db)
      expect(res.code).toBe(4)
    })

    test('加入成功应更新成员列表', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.getQueue.push([{ _id: 'c1', members: ['creator'] }])

      const res = await classManage._joinClass('123456', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.classId).toBe('c1')
      expect(sideEffects.updates.length).toBe(1)
    })
  })

  describe('getClassDetail', () => {
    test('非班级成员应被拒绝查看', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'c1', createdBy: 'other', members: ['other'] } })

      const res = await classManage._getClassDetail('c1', 'openid', db)
      expect(res.code).toBe(5)
    })

    test('成员查看详情应返回共享单元', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({
        data: {
          _id: 'c1',
          createdBy: 'other',
          members: ['openid'],
          sharedUnitIds: ['u1', 'u2'],
          name: '班级1'
        }
      })
      // paginateQuery 的 units 查询：一次返回全部
      queues.getQueue.push([
        { _id: 'u1', name: '单元1', order: 1 },
        { _id: 'u2', name: '单元2', order: 2 }
      ])

      const res = await classManage._getClassDetail('c1', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.data.sharedUnits.length).toBe(2)
      expect(res.data.isCreator).toBe(false)
    })
  })

  describe('getMyClasses', () => {
    test('应返回我创建或加入的班级', async () => {
      const { db, queues } = createMockDb()
      queues.getQueue.push([
        { _id: 'c1', name: '我创建的班级', createdBy: 'openid' },
        { _id: 'c2', name: '我加入的班级', createdBy: 'other', members: ['openid'] }
      ])

      const res = await classManage._getMyClasses('openid', db)
      expect(res.code).toBe(0)
      expect(res.data.length).toBe(2)
    })
  })

  describe('shareUnit', () => {
    test('非班级成员不能共享单元', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'c1', createdBy: 'other', members: ['other'] } },
        { data: { _id: 'u1', createdBy: 'openid' } }
      )

      const res = await classManage._shareUnit('c1', 'u1', 'openid', db)
      expect(res.code).toBe(5)
    })

    test('只能共享自己创建的单元', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'c1', createdBy: 'openid', members: ['openid'] } },
        { data: { _id: 'u1', createdBy: 'other' } }
      )

      const res = await classManage._shareUnit('c1', 'u1', 'openid', db)
      expect(res.code).toBe(5)
    })

    test('共享成功应更新共享列表', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'c1', createdBy: 'openid', members: ['openid'], sharedUnitIds: [] } },
        { data: { _id: 'u1', createdBy: 'openid' } }
      )

      const res = await classManage._shareUnit('c1', 'u1', 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.updates.length).toBe(1)
    })

    test('重复共享应返回提示', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'c1', createdBy: 'openid', members: ['openid'], sharedUnitIds: ['u1'] } },
        { data: { _id: 'u1', createdBy: 'openid' } }
      )

      const res = await classManage._shareUnit('c1', 'u1', 'openid', db)
      expect(res.code).toBe(0)
      expect(res.message).toBe('该单元已在共享列表中')
    })
  })

  describe('unshareUnit', () => {
    test('非创建者且非单元所有者不能取消共享', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'c1', createdBy: 'other', members: ['openid'] } },
        { data: { _id: 'u1', createdBy: 'another' } }
      )

      const res = await classManage._unshareUnit('c1', 'u1', 'openid', db)
      expect(res.code).toBe(5)
    })

    test('单元所有者可以取消共享', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push(
        { data: { _id: 'c1', createdBy: 'other', members: ['openid'] } },
        { data: { _id: 'u1', createdBy: 'openid' } }
      )

      const res = await classManage._unshareUnit('c1', 'u1', 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.updates.length).toBe(1)
    })
  })

  describe('leaveClass', () => {
    test('创建者不能退出班级', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'c1', createdBy: 'openid', members: ['openid'] } })

      const res = await classManage._leaveClass('c1', 'openid', db)
      expect(res.code).toBe(6)
    })

    test('成员退出成功应更新成员列表', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'c1', createdBy: 'other', members: ['openid', 'other'] } })

      const res = await classManage._leaveClass('c1', 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.updates.length).toBe(1)
    })
  })

  describe('dismissClass', () => {
    test('非创建者不能解散班级', async () => {
      const { db, queues } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'c1', createdBy: 'other' } })

      const res = await classManage._dismissClass('c1', 'openid', db)
      expect(res.code).toBe(5)
    })

    test('创建者解散班级成功', async () => {
      const { db, queues, sideEffects } = createMockDb()
      queues.docGetQueue.push({ data: { _id: 'c1', createdBy: 'openid' } })

      const res = await classManage._dismissClass('c1', 'openid', db)
      expect(res.code).toBe(0)
      expect(sideEffects.removes.length).toBe(1)
    })
  })
})
