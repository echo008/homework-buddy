import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '@/lib/storage'
import { toast } from '@/lib/utils'

export default function Settings() {
  const navigate = useNavigate()
  const units = storage.getUnits()
  const totalWords = units.reduce((sum, u) => sum + storage.getWordCount(u.id), 0)
  const records = storage.getRecords()
  const [version] = useState('2.0.0')

  function exportData() {
    const dataStr = storage.exportData()
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `智听-词库备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('备份文件已导出')
  }

  function importData() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        if (storage.importData(content)) {
          toast.success('导入成功！数据已恢复')
          setTimeout(() => location.reload(), 800)
        } else {
          toast.error('导入失败，请检查文件格式')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function clearAll() {
    if (!confirm('确定清空所有数据（词库、记录）？此操作不可恢复！')) return
    if (!confirm('再次确认：真的要删除所有数据吗？')) return
    storage.clearAll()
    toast.success('已清空所有数据')
    setTimeout(() => location.reload(), 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-8">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">设置</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-3">📊 数据统计</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{units.length}</div>
              <div className="text-xs text-gray-500 mt-1">单元</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{totalWords}</div>
              <div className="text-xs text-gray-500 mt-1">单词/词语</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{records.length}</div>
              <div className="text-xs text-gray-500 mt-1">听写记录</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">🔊 语音播报</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">TTS引擎</div>
                <div className="text-xs text-gray-500 mt-0.5">有道词典语音合成（免费稳定）</div>
              </div>
              <div className="text-sm text-emerald-600 font-medium">已启用</div>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">降级方案</div>
                <div className="text-xs text-gray-500 mt-0.5">有道不可用时自动切换浏览器内置语音</div>
              </div>
              <div className="text-sm text-emerald-600 font-medium">自动</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">💾 数据备份与恢复</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <button onClick={exportData} className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50">
              <span className="text-2xl">📤</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">导出备份</div>
                <div className="text-xs text-gray-500 mt-0.5">导出所有词库和记录为JSON文件</div>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            <button onClick={importData} className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50">
              <span className="text-2xl">📥</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">导入恢复</div>
                <div className="text-xs text-gray-500 mt-0.5">从备份文件恢复词库数据</div>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            <button onClick={clearAll} className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50">
              <span className="text-2xl">🗑</span>
              <div className="flex-1">
                <div className="font-medium text-red-600">清空所有数据</div>
                <div className="text-xs text-gray-500 mt-0.5">删除所有词库、听写记录</div>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-3">ℹ️ 关于</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            <div className="px-4 py-4 flex items-center justify-between">
              <span className="text-gray-700">应用名称</span>
              <span className="text-gray-500">智听 - 智能听写助手</span>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <span className="text-gray-700">版本</span>
              <span className="text-gray-500">v{version}</span>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <span className="text-gray-700">技术支持</span>
              <span className="text-gray-500 text-sm">纯前端 · 本地存储</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pt-4">
          家长省心，孩子开心 ❤️
        </p>
      </div>
    </div>
  )
}
