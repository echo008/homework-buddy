import request from './request'
import type {
  ApiResponse,
  User,
  Unit,
  Word,
  Question,
  DictationLog,
  DictationConfig,
  ClassInfo,
  PresetTextbook,
  PresetUnit,
  PresetWord,
  Subject
} from '@shared/types'

export const authApi = {
  login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return request.post('/auth/login', { username, password })
  },
  register(username: string, password: string, nickname?: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return request.post('/auth/register', { username, password, nickname })
  },
  getMe(): Promise<ApiResponse<User>> {
    return request.get('/auth/me')
  }
}

export const unitApi = {
  list(subject?: Subject): Promise<ApiResponse<Unit[]>> {
    return request.get('/units', { params: { subject } })
  },
  create(data: Partial<Unit>): Promise<ApiResponse<Unit>> {
    return request.post('/units', data)
  },
  update(id: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> {
    return request.put(`/units/${id}`, data)
  },
  remove(id: string): Promise<ApiResponse<void>> {
    return request.delete(`/units/${id}`)
  }
}

export const wordApi = {
  listByUnit(unitId: string): Promise<ApiResponse<Word[]>> {
    return request.get('/words', { params: { unitId } })
  },
  create(data: Partial<Word>): Promise<ApiResponse<Word>> {
    return request.post('/words', data)
  },
  update(id: string, data: Partial<Word>): Promise<ApiResponse<Word>> {
    return request.put(`/words/${id}`, data)
  },
  remove(id: string): Promise<ApiResponse<void>> {
    return request.delete(`/words/${id}`)
  },
  batchImport(words: Partial<Word>[], unitId: string): Promise<ApiResponse<{ count: number }>> {
    return request.post('/words/batch', { words, unitId })
  }
}

export const dictationApi = {
  start(config: DictationConfig): Promise<ApiResponse<{ questions: Question[]; unitNames: string[] }>> {
    return request.post('/dictation/start', config)
  }
}

export const logApi = {
  list(limit: number = 20): Promise<ApiResponse<DictationLog[]>> {
    return request.get('/logs', { params: { limit } })
  },
  get(id: string): Promise<ApiResponse<DictationLog>> {
    return request.get(`/logs/${id}`)
  },
  save(data: Partial<DictationLog>): Promise<ApiResponse<DictationLog>> {
    return request.post('/logs', data)
  },
  remove(id: string): Promise<ApiResponse<void>> {
    return request.delete(`/logs/${id}`)
  },
  getWrongWords(limit: number = 50): Promise<ApiResponse<Word[]>> {
    return request.get('/logs/wrong-words', { params: { limit } })
  }
}

export const classApi = {
  myList(): Promise<ApiResponse<ClassInfo[]>> {
    return request.get('/classes')
  },
  create(name: string, subject: Subject): Promise<ApiResponse<ClassInfo>> {
    return request.post('/classes', { name, subject })
  },
  join(code: string): Promise<ApiResponse<ClassInfo>> {
    return request.post('/classes/join', { code })
  },
  detail(id: string): Promise<ApiResponse<ClassInfo>> {
    return request.get(`/classes/${id}`)
  },
  share(classId: string, unitId: string): Promise<ApiResponse<void>> {
    return request.post(`/classes/${classId}/share`, { unitId })
  },
  unshare(classId: string, unitId: string): Promise<ApiResponse<void>> {
    return request.post(`/classes/${classId}/unshare`, { unitId })
  },
  leave(id: string): Promise<ApiResponse<void>> {
    return request.post(`/classes/${id}/leave`)
  },
  dismiss(id: string): Promise<ApiResponse<void>> {
    return request.delete(`/classes/${id}`)
  }
}

export const presetApi = {
  filters(): Promise<ApiResponse<{ gradeLevels: string[]; versions: string[] }>> {
    return request.get('/preset/filters')
  },
  textbooks(params: { gradeLevel?: string; subject?: string; version?: string }): Promise<ApiResponse<PresetTextbook[]>> {
    return request.get('/preset/textbooks', { params })
  },
  units(textbookId: string): Promise<ApiResponse<PresetUnit[]>> {
    return request.get('/preset/units', { params: { textbookId } })
  },
  previewWords(unitId: string, limit: number = 20): Promise<ApiResponse<PresetWord[]>> {
    return request.get(`/preset/units/${unitId}/words`, { params: { limit } })
  },
  importUnits(presetUnitIds: string[]): Promise<ApiResponse<{ count: number }>> {
    return request.post('/preset/import', { presetUnitIds })
  }
}

export const ocrApi = {
  parseImage(file: File, subject: Subject): Promise<ApiResponse<{ words: string[] }>> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('subject', subject)
    return request.post('/ocr/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const uploadApi = {
  uploadAudio(file: File, wordId?: string): Promise<ApiResponse<{ audioUrl: string }>> {
    const formData = new FormData()
    formData.append('audio', file)
    if (wordId) {
      formData.append('wordId', wordId)
    }
    return request.post('/upload/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
