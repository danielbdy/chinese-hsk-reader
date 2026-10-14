import { numberedToMarks } from './pinyin.ts'
import type { Dictionary } from './types.ts'

export interface CedictEntry {
  simplified: string
  pinyin: string
  english: string[]
}

const MAX_MEANINGS = 5

/** Groups CC-CEDICT entries by simplified word, with tone-marked pinyin and at most 5 meanings each. */
export function buildDictionary(entries: readonly CedictEntry[]): Dictionary {
  const dict: Dictionary = {}
  for (const entry of entries) {
    ;(dict[entry.simplified] ??= []).push([
      numberedToMarks(entry.pinyin),
      entry.english.slice(0, MAX_MEANINGS),
    ])
  }
  return dict
}
