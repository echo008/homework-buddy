import type { PresetUnit } from './types'
import { ENGLISH_ALL_PRESETS } from './english-presets'
import { CHINESE_ALL_PRESETS } from './chinese-presets'

function findUnit(id: string): PresetUnit | undefined {
  return [...ENGLISH_ALL_PRESETS, ...CHINESE_ALL_PRESETS].find(u => u.id === id)
}

const defaultUnitIds = [
  'en-pep-p3a-u1',
  'en-pep-j1a-u1',
  'cn-bubd-p1-u1',
]

export const DEFAULT_PRESETS: PresetUnit[] = defaultUnitIds
  .map(id => findUnit(id))
  .filter((u): u is PresetUnit => !!u)
