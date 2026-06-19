// tests/tts.test.js
const { resolveLang } = require('../miniprogram/utils/tts.js')

describe('tts 工具', () => {
  test('resolveLang 应根据 promptType 返回正确语言', () => {
    expect(resolveLang('english', 'english')).toBe('en_US')
    expect(resolveLang('chinese', 'english')).toBe('zh_CN')
    expect(resolveLang('pinyin', 'chinese')).toBe('zh_CN')
    expect(resolveLang('english', 'chinese')).toBe('en_US')
  })
})
