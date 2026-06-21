// tests/commonUtils.test.js
const { paginateQuery, isUnitAccessible, getAccessibleUnitIds } = require('../miniprogram/cloudfunctions/common/utils.js')

function createMockDb() {
  const getQueue = []
  const docGetQueue = []
  const command = {
    in: jest.fn((arr) => ({ $in: arr })),
    or: jest.fn((cond) => ({ $or: cond }))
  }

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
    doc: jest.fn(() => ({
      get: jest.fn(() => {
        const next = docGetQueue.shift()
        return Promise.resolve(next !== undefined ? next : { data: null })
      }),
      update: jest.fn(() => Promise.resolve({})),
      remove: jest.fn(() => Promise.resolve({}))
    }))
  }

  const db = {
    collection: jest.fn(() => chain),
    doc: jest.fn(() => ({
      get: jest.fn(() => {
        const next = docGetQueue.shift()
        return Promise.resolve(next !== undefined ? next : { data: null })
      }),
      update: jest.fn(() => Promise.resolve({})),
      remove: jest.fn(() => Promise.resolve({}))
    })),
    command
  }

  return { db, chain, command, getQueue, docGetQueue }
}

describe('common/utils 通用工具', () => {
  describe('paginateQuery', () => {
    test('应自动翻页并聚合结果', async () => {
      const { db, chain } = createMockDb()
      chain.get
        .mockResolvedValueOnce({ data: [{ _id: 'a' }, { _id: 'b' }] })
        .mockResolvedValueOnce({ data: [{ _id: 'c' }] })
        .mockResolvedValueOnce({ data: [] })

      const res = await paginateQuery(db.collection('units').where({}), 2)
      expect(res).toEqual([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }])
      expect(chain.skip).toHaveBeenCalledTimes(2)
    })
  })

  describe('isUnitAccessible', () => {
    test('单元创建者应有权限', async () => {
      const { db, docGetQueue } = createMockDb()
      docGetQueue.push({ data: { _id: 'u1', createdBy: 'test_openid' } })

      const res = await isUnitAccessible('u1', 'test_openid', db)
      expect(res).toBe(true)
    })

    test('非创建者但所在班级共享了该单元应有权限', async () => {
      const { db, docGetQueue, getQueue } = createMockDb()
      docGetQueue.push({ data: { _id: 'u1', createdBy: 'other_openid' } })
      getQueue.push({ data: [{ _id: 'c1' }] })

      const res = await isUnitAccessible('u1', 'test_openid', db)
      expect(res).toBe(true)
    })

    test('非创建者且班级未共享应无权限', async () => {
      const { db, docGetQueue, getQueue } = createMockDb()
      docGetQueue.push({ data: { _id: 'u1', createdBy: 'other_openid' } })
      getQueue.push({ data: [] })

      const res = await isUnitAccessible('u1', 'test_openid', db)
      expect(res).toBe(false)
    })

    test('异常时应返回 false 而非抛错', async () => {
      const { db } = createMockDb()
      db.doc.mockImplementation(() => { throw new Error('db error') })

      const res = await isUnitAccessible('u1', 'test_openid', db)
      expect(res).toBe(false)
    })
  })

  describe('getAccessibleUnitIds', () => {
    test('应返回自己创建的单元', async () => {
      const { db, command, getQueue } = createMockDb()
      getQueue.push({ data: [{ _id: 'u1' }, { _id: 'u2' }] }) // myUnits
      getQueue.push({ data: [] }) // myClasses

      const ids = await getAccessibleUnitIds('test_openid', 'english', db, command)
      expect(ids).toEqual(new Set(['u1', 'u2']))
    })

    test('应合并班级共享的单元并过滤学科', async () => {
      const { db, command, getQueue } = createMockDb()
      getQueue.push({ data: [{ _id: 'u1' }] }) // myUnits
      getQueue.push({ data: [{ sharedUnitIds: ['u2', 'u3'] }] }) // myClasses
      getQueue.push({ data: [{ _id: 'u2' }] }) // sharedUnits filtered by subject

      const ids = await getAccessibleUnitIds('test_openid', 'english', db, command)
      expect(ids).toEqual(new Set(['u1', 'u2']))
      expect(command.in).toHaveBeenCalledWith(['u2', 'u3'])
    })

    test('subject 为空时不按学科过滤', async () => {
      const { db, command, getQueue } = createMockDb()
      getQueue.push({ data: [{ _id: 'u1' }] }) // myUnits
      getQueue.push({ data: [{ sharedUnitIds: ['u2'] }] }) // myClasses
      getQueue.push({ data: [{ _id: 'u2' }] }) // sharedUnits

      const ids = await getAccessibleUnitIds('test_openid', '', db, command)
      expect(ids).toEqual(new Set(['u1', 'u2']))
    })
  })
})
