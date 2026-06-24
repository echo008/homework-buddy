import Tesseract from 'tesseract.js'
import { ALLOWED_SUBJECTS } from '../../shared/constants.js'
import type { Subject } from '../../shared/types.js'

// 简单的文本解析：按行分割，尝试提取"单词 释义"或"汉字 拼音"格式
function parseOcrText(text: string, subject: Subject): Array<{ word: string; meaning: string; pinyin?: string }> {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
  const results: Array<{ word: string; meaning: string; pinyin?: string }> = []

  for (const line of lines) {
    if (subject === 'english') {
      // 匹配 "word 释义" 或 "word\t释义" 或 "word  释义"（多空格）
      const m = line.match(/^([a-zA-Z][a-zA-Z\-']*)\s+(.+)$/)
      if (m) {
        results.push({ word: m[1].trim(), meaning: m[2].trim() })
      } else if (/^[a-zA-Z][a-zA-Z\-']*$/.test(line)) {
        results.push({ word: line, meaning: '' })
      }
    } else {
      // 语文：每行一个汉字/词语，或者 "汉字 拼音"
      const m = line.match(/^([\u4e00-\u9fa5]+)\s+([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s]*)$/)
      if (m) {
        results.push({ word: m[1].trim(), meaning: '', pinyin: m[2].trim() })
      } else {
        // 逐字拆分（简单模式）
        const chars = line.match(/[\u4e00-\u9fa5]/g)
        if (chars) {
          for (const c of chars) {
            results.push({ word: c, meaning: '' })
          }
        }
      }
    }
  }
  return results
}

export async function parseImage(imagePath: string, subject: Subject = 'english') {
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return { code: 2, message: '学科类型不正确' }
  }

  const lang = subject === 'english' ? 'eng' : 'chi_sim+eng'
  const { data } = await Tesseract.recognize(imagePath, lang, {
    logger: () => {}
  })

  const words = parseOcrText(data.text, subject)
  return {
    code: 0,
    data: {
      text: data.text,
      words,
      confidence: data.confidence
    }
  }
}
