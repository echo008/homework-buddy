const STORAGE_KEY = 'smart-dictation-data'

export interface Word {
  id: string
  unitId: string
  word: string
  meaning: string
  pinyin?: string
  phonetic?: string
  lesson?: number
  createdAt: number
}

export interface Unit {
  id: string
  name: string
  subject: 'english' | 'chinese'
  description?: string
  order: number
  createdAt: number
}

export interface DictationRecord {
  id: string
  unitIds: string[]
  unitNames: string[]
  subject: string
  mode: string
  totalCount: number
  createdAt: number
  duration: number
  words: Array<{
    word: string
    meaning: string
  }>
}

interface AppData {
  units: Unit[]
  words: Word[]
  records: DictationRecord[]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return {
    units: [],
    words: [],
    records: []
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const storage = {
  getUnits(): Unit[] {
    return loadData().units.sort((a, b) => a.order - b.order || b.createdAt - a.createdAt)
  },

  getUnit(id: string): Unit | null {
    return loadData().units.find(u => u.id === id) || null
  },

  createUnit(input: { name: string; subject: 'english' | 'chinese'; description?: string }): Unit {
    const data = loadData()
    const unit: Unit = {
      id: generateId(),
      name: input.name,
      subject: input.subject,
      description: input.description,
      order: data.units.length,
      createdAt: Date.now()
    }
    data.units.push(unit)
    saveData(data)
    return unit
  },

  updateUnit(id: string, input: Partial<Omit<Unit, 'id' | 'createdAt'>>) {
    const data = loadData()
    const idx = data.units.findIndex(u => u.id === id)
    if (idx !== -1) {
      data.units[idx] = { ...data.units[idx], ...input }
      saveData(data)
    }
  },

  deleteUnit(id: string) {
    const data = loadData()
    data.units = data.units.filter(u => u.id !== id)
    data.words = data.words.filter(w => w.unitId !== id)
    saveData(data)
  },

  getWords(unitId?: string): Word[] {
    const data = loadData()
    let words = data.words
    if (unitId) {
      words = words.filter(w => w.unitId === unitId)
    }
    return words.sort((a, b) => (a.lesson || 0) - (b.lesson || 0) || a.createdAt - b.createdAt)
  },

  addWord(input: Omit<Word, 'id' | 'createdAt'>): Word {
    const data = loadData()
    const word: Word = {
      ...input,
      id: generateId(),
      createdAt: Date.now()
    }
    data.words.push(word)
    saveData(data)
    return word
  },

  addWordsBatch(words: Array<Omit<Word, 'id' | 'createdAt'>>): Word[] {
    const data = loadData()
    const newWords: Word[] = words.map(w => ({
      ...w,
      id: generateId(),
      createdAt: Date.now()
    }))
    data.words.push(...newWords)
    saveData(data)
    return newWords
  },

  updateWord(id: string, input: Partial<Omit<Word, 'id' | 'createdAt' | 'unitId'>>) {
    const data = loadData()
    const idx = data.words.findIndex(w => w.id === id)
    if (idx !== -1) {
      data.words[idx] = { ...data.words[idx], ...input }
      saveData(data)
    }
  },

  deleteWord(id: string) {
    const data = loadData()
    data.words = data.words.filter(w => w.id !== id)
    saveData(data)
  },

  getRecords(): DictationRecord[] {
    return loadData().records.sort((a, b) => b.createdAt - a.createdAt)
  },

  addRecord(record: Omit<DictationRecord, 'id'>): DictationRecord {
    const data = loadData()
    const newRecord: DictationRecord = {
      ...record,
      id: generateId()
    }
    data.records.unshift(newRecord)
    saveData(data)
    return newRecord
  },

  getWordCount(unitId: string): number {
    return loadData().words.filter(w => w.unitId === unitId).length
  },

  importPreset(unitName: string, subject: 'english' | 'chinese', words: Array<{word: string; meaning: string; phonetic?: string}>) {
    const unit = this.createUnit({ name: unitName, subject })
    const data = loadData()
    const newWords: Word[] = words.map((w, i) => ({
      id: generateId(),
      unitId: unit.id,
      word: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic,
      lesson: 1,
      createdAt: Date.now() + i
    }))
    data.words.push(...newWords)
    saveData(data)
    return { unit, count: newWords.length }
  },

  exportData(): string {
    return JSON.stringify(loadData(), null, 2)
  },

  importData(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr)
      if (parsed.units && parsed.words && parsed.records) {
        saveData({
          units: parsed.units || [],
          words: parsed.words || [],
          records: parsed.records || []
        })
        return true
      }
    } catch {}
    return false
  },

  clearAll() {
    saveData({ units: [], words: [], records: [] })
  }
}
