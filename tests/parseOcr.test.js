// tests/parseOcr.test.js
const parseOcr = require('../miniprogram/cloudfunctions/parseOcr/index.js')

describe('parseOcr 内部 helper', () => {
  test('buildPrompt 应包含 word / meaning 字段要求', () => {
    const enPrompt = parseOcr._buildPrompt('hello world', 'english')
    expect(enPrompt).toContain('word')
    expect(enPrompt).toContain('meaning')
    expect(enPrompt).toContain('hello world')

    const cnPrompt = parseOcr._buildPrompt('你好 世界', 'chinese')
    expect(cnPrompt).toContain('pinyin')
    expect(cnPrompt).toContain('meaning')
  })

  test('extractJsonArray 应解析 Markdown 代码块与纯数组', () => {
    const md = "```json\n[{\"word\":\"a\",\"meaning\":\"1\"}]\n```"
    expect(parseOcr._extractJsonArray(md)).toEqual([{ word: 'a', meaning: '1' }])

    const plain = '[{"word":"b","meaning":"2"}]'
    expect(parseOcr._extractJsonArray(plain)).toEqual([{ word: 'b', meaning: '2' }])

    expect(parseOcr._extractJsonArray('')).toEqual([])
    expect(parseOcr._extractJsonArray('not json')).toEqual([])
  })

  test('isValidWord 应清洗并过滤非法项', () => {
    const en = { word: '  apple  ', meaning: '苹果' }
    expect(parseOcr._isValidWord(en, 'english')).toBe(true)
    expect(en.word).toBe('apple')

    expect(parseOcr._isValidWord({ word: '', meaning: '苹果' }, 'english')).toBe(false)
    expect(parseOcr._isValidWord({ word: '123', meaning: '' }, 'english')).toBe(false)

    const cn = { word: '  鹏  ', meaning: '大鹏' }
    expect(parseOcr._isValidWord(cn, 'chinese')).toBe(true)
    expect(cn.word).toBe('鹏')
  })

  test('normalizeForDedupe 应忽略大小写与空格', () => {
    expect(parseOcr._normalizeForDedupe(' Hello World ')).toBe('helloworld')
    expect(parseOcr._normalizeForDedupe(' 中 国 ')).toBe('中国')
  })

  test('buildWordDoc 应生成符合 schema 的文档', () => {
    const item = { word: 'apple', meaning: '苹果', partOfSpeech: 'n.', phonetic: '/æ/', lesson: 2 }
    const doc = parseOcr._buildWordDoc(item, 'english', 'unit_1', 'openid_1', '2024-01-01T00:00:00Z')
    expect(doc.word).toBe('apple')
    expect(doc.meaning).toBe('苹果')
    expect(doc.subject).toBe('english')
    expect(doc.unitId).toBe('unit_1')
    expect(doc.source).toBe('ocr')
    expect(doc.lesson).toBe(2)
    expect(doc.pinyin).toBe('')

    const cn = parseOcr._buildWordDoc({ word: '鹏', meaning: '大鹏', pinyin: 'péng' }, 'chinese', 'unit_2', 'openid_1', '2024-01-01T00:00:00Z')
    expect(cn.pinyin).toBe('péng')
    expect(cn.partOfSpeech).toBe('')
  })
})
