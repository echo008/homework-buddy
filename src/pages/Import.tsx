import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '@/lib/storage'
import { toast } from '@/lib/utils'

type Subject = 'english' | 'chinese'

interface ParsedWord {
  word: string
  meaning: string
  phonetic: string
}

const UNIT_SPLIT_RE = /[\n\r]+/
const LINE_SPLIT_RE = /\t|\s{2,}|[|｜,:：\-—=](?:\s+)?/

export default function ImportPage() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState<Subject>('english')
  const [unitName, setUnitName] = useState('')
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedWord[]>([])

  function parseText() {
    const raw = text.trim()
    if (!raw) {
      toast.error('请粘贴内容')
      return
    }
    const lines = raw.split(UNIT_SPLIT_RE).map(l => l.trim()).filter(Boolean)
    const result: ParsedWord[] = []
    const seen = new Set<string>()

    for (const line of lines) {
      if (subject === 'english') {
        const parts = line.split(LINE_SPLIT_RE).map(p => p.trim()).filter(Boolean)
        if (parts.length === 0) continue
        let word = parts[0]
        let meaning = ''
        let phonetic = ''
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i]
          if (p.startsWith('/') || p.startsWith('[') || /\[.*\]/.test(p) || /\/.*\//.test(p)) {
            phonetic = p.replace(/[\[\]\/]/g, '')
          } else if (!meaning) {
            meaning = p
          } else {
            meaning += ' ' + p
          }
        }
        word = word.replace(/[\[\]\/]/g, '').trim()
        if (!/^[a-zA-Z][a-zA-Z\s'-]*$/.test(word) || word.length < 1) continue
        const key = word.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        result.push({ word, meaning, phonetic })
      } else {
        const parts = line.split(LINE_SPLIT_RE).map(p => p.trim()).filter(Boolean)
        if (parts.length === 0) continue
        let word = parts[0]
        let meaning = ''
        let phonetic = ''
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i]
          if (/^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹ]+(\s[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹ]+)*$/.test(p) && !phonetic) {
            phonetic = p
          } else if (!meaning) {
            meaning = p
          } else {
            meaning += ' ' + p
          }
        }
        if (!/[\u4e00-\u9fa5]/.test(word)) continue
        if (seen.has(word)) continue
        seen.add(word)
        result.push({ word, meaning, phonetic })
      }
    }

    setParsed(result)
    if (result.length === 0) {
      toast.error('未能解析出有效词语，请检查格式')
    } else {
      toast.success(`成功解析 ${result.length} 个${subject === 'english' ? '单词' : '词语'}`)
    }
  }

  function doImport() {
    if (parsed.length === 0) {
      toast.error('请先解析文本')
      return
    }
    const name = unitName.trim() || `自定义导入 - ${new Date().toLocaleDateString('zh-CN')}`
    const existing = storage.getUnits().find(u => u.name === name)
    let unitId: string
    if (existing) {
      if (!confirm(`单元"${name}"已存在，是否追加导入到该单元？`)) return
      unitId = existing.id
    } else {
      const unit = storage.createUnit({ name, subject, description: '来自文本批量导入' })
      unitId = unit.id
    }
    storage.addWordsBatch(parsed.map(w => ({ unitId, ...w })))
    toast.success(`已导入 ${parsed.length} 个${subject === 'english' ? '单词' : '词语'}！`)
    navigate(`/units/${unitId}/words`)
  }

  function loadExample() {
    if (subject === 'english') {
      setText(`apple /ˈæpl/ 苹果
banana /bəˈnænə/ 香蕉
cat /kæt/ 猫
dog /dɔːɡ/ 狗
hello /həˈləʊ/ 你好
book /bʊk/ 书
pen /pen/ 钢笔
teacher /ˈtiːtʃə(r)/ 老师`)
    } else {
      setText(`一 yī 数字一
二 èr 数字二
人 rén 人类
天 tiān 天空
地 dì 大地
山水 shān shuǐ 山和水
花草 huā cǎo 花朵和小草`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-8">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">批量导入</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
          <p className="text-sky-800 text-sm">📝 每行一个词，支持：单词 音标 释义（用Tab/空格/|/:-分隔）</p>
        </div>

        <div>
          <label className="text-base font-semibold text-gray-800 mb-2 block">学科</label>
          <div className="grid grid-cols-2 gap-3">
            {(['english', 'chinese'] as Subject[]).map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`py-3 rounded-xl font-medium transition-all ${subject === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700'}`}
              >{s === 'english' ? '英语' : '语文'}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-base font-semibold text-gray-800 mb-2 block">单元名称</label>
          <input
            type="text"
            value={unitName}
            onChange={e => setUnitName(e.target.value)}
            placeholder="自定义单元名（默认使用日期）"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-base font-semibold text-gray-800">粘贴词表</label>
            <button onClick={loadExample} className="text-sm text-indigo-600 px-3 py-1">载入示例</button>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={subject === 'english'
              ? 'apple /ˈæpl/ 苹果\nbanana /bəˈnænə/ 香蕉\n...'
              : '苹果 píng guǒ 一种水果\n学校 xué xiào 学习的地方\n...'}
            className="w-full h-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:outline-none font-mono text-sm resize-none"
          />
        </div>

        <button
          onClick={parseText}
          className="w-full py-4 bg-indigo-100 text-indigo-700 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform"
        >
          🔍 解析预览
        </button>

        {parsed.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">解析预览（{parsed.length}个）</h3>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {parsed.map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="font-semibold text-gray-900 min-w-20">{w.word}</div>
                  {w.phonetic && <div className="text-sm text-gray-400">{w.phonetic}</div>}
                  <div className="text-sm text-gray-600 flex-1 text-right truncate">{w.meaning}</div>
                </div>
              ))}
            </div>

            <button
              onClick={doImport}
              className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
            >
              ✅ 确认导入 {parsed.length} 个词
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
