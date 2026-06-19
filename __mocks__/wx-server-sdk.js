// __mocks__/wx-server-sdk.js
const words = [
  { _id: 'w1', word: 'apple', meaning: '苹果', unitId: 'u1', subject: 'english', lesson: 1 },
  { _id: 'w2', word: 'banana', meaning: '香蕉', unitId: 'u1', subject: 'english', lesson: 1 },
  { _id: 'w3', word: 'cat', meaning: '猫', unitId: 'u2', subject: 'english', lesson: 2 },
  { _id: 'w4', word: '鹏', meaning: '大鹏', unitId: 'u3', subject: 'chinese', lesson: 1, pinyin: 'péng' }
]

const mockDb = {
  collection: jest.fn(() => mockDb),
  where: jest.fn(() => mockDb),
  field: jest.fn(() => mockDb),
  orderBy: jest.fn(() => mockDb),
  limit: jest.fn(() => mockDb),
  skip: jest.fn(() => mockDb),
  get: jest.fn(() => Promise.resolve({ data: words })),
  count: jest.fn(() => Promise.resolve({ total: words.length })),
  add: jest.fn((doc) => Promise.resolve({ _id: `new_${Date.now()}` })),
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: words[0] })),
    update: jest.fn(() => Promise.resolve({})),
    remove: jest.fn(() => Promise.resolve({}))
  })),
  command: {
    in: jest.fn((arr) => ({ $in: arr })),
    or: jest.fn((cond) => ({ $or: cond })),
    pull: jest.fn((val) => ({ $pull: val })),
    neq: jest.fn((val) => ({ $neq: val }))
  }
}

module.exports = {
  init: jest.fn(),
  DYNAMIC_CURRENT_ENV: 'test-env',
  getWXContext: jest.fn(() => ({ OPENID: 'test_openid' })),
  database: jest.fn(() => mockDb),
  getTempFileURL: jest.fn(() => Promise.resolve({ fileList: [{ tempFileURL: 'https://example.com/img.jpg' }] })),
  uploadFile: jest.fn(() => Promise.resolve({ fileID: 'cloud://test.jpg' }))
}
