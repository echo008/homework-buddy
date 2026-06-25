import type { PresetUnit } from './types'
export * from './types'
import { ENGLISH_ALL_PRESETS } from './english-presets'
import { CHINESE_ALL_PRESETS } from './chinese-presets'

export type { PresetUnit }
export type { PresetWord } from './types'

export const ALL_PRESETS: PresetUnit[] = [...ENGLISH_ALL_PRESETS, ...CHINESE_ALL_PRESETS]

export function getPresetsBySubject(subject: 'english' | 'chinese'): PresetUnit[] {
  return ALL_PRESETS.filter(p => p.subject === subject)
}

export function getPresetsBySubjectAndGrade(subject: 'english' | 'chinese', grade: string): PresetUnit[] {
  return ALL_PRESETS.filter(p => p.subject === subject && p.grade === grade)
}

export function getPresetsBySubjectAndTextbook(subject: 'english' | 'chinese', textbook: string): PresetUnit[] {
  return ALL_PRESETS.filter(p => p.subject === subject && p.textbook === textbook)
}

export function groupPresetsByGrade(presets: PresetUnit[]): Record<string, PresetUnit[]> {
  const groups: Record<string, PresetUnit[]> = {}
  presets.forEach(p => {
    if (!groups[p.grade]) groups[p.grade] = []
    groups[p.grade].push(p)
  })
  return groups
}

export function getTextbooks(subject: 'english' | 'chinese'): string[] {
  const set = new Set<string>()
  ALL_PRESETS.filter(p => p.subject === subject).forEach(p => set.add(p.textbook))
  return Array.from(set)
}

export { ENGLISH_ALL_PRESETS, CHINESE_ALL_PRESETS }
