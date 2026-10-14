import type { Token, WordData } from './annotate'

export interface Sense {
  pinyin: string
  meanings: string[]
}

export interface LookupEntry {
  word: string
  senses: Sense[]
}

export interface LookupResult {
  /** True when the dictionary has the whole word; false when it is explained by its pieces. */
  whole: boolean
  entries: LookupEntry[]
  /** A short meaning for a flashcard, from the sense that matches the pinyin in context. */
  summary: string
}

const toneless = (pinyin: string) =>
  pinyin
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()

/** All senses of one dictionary word, the one read as `pinyin` first, HSK meanings preferred. */
export function sensesFor(word: string, data: WordData, pinyin = ''): Sense[] {
  const senses: Sense[] = []
  const hsk = data.hsk[word]
  if (hsk) senses.push({ pinyin: hsk[1], meanings: hsk[2] })
  for (const [p, meanings] of data.dict[word] ?? []) {
    // Skip CC-CEDICT readings the HSK entry already covers.
    if (hsk && p.toLowerCase() === hsk[1].toLowerCase()) continue
    senses.push({ pinyin: p, meanings })
  }
  const target = pinyin.toLowerCase()
  const exact = senses.findIndex((s) => s.pinyin.toLowerCase() === target)
  const loose = exact === -1 ? senses.findIndex((s) => toneless(s.pinyin) === toneless(target)) : exact
  if (loose > 0) senses.unshift(...senses.splice(loose, 1))
  return senses
}

/** Explains a token: its own dictionary senses, or each piece's when the word isn't in the dictionary. */
export function lookup(token: Token, data: WordData): LookupResult {
  const whole = token.lookup.length === 1
  const syllables = token.pinyin.split(' ')
  let offset = 0
  const entries = token.lookup.map((word) => {
    const length = Array.from(word).length
    const pinyin = whole ? token.pinyin : syllables.slice(offset, offset + length).join(' ')
    offset += length
    return { word, senses: sensesFor(word, data, pinyin) }
  })

  const summary = whole
    ? (entries[0]?.senses[0]?.meanings.slice(0, 3).join('; ') ?? '')
    : entries.map((e) => `${e.word}: ${e.senses[0]?.meanings[0] ?? '?'}`).join(' + ')

  return { whole, entries, summary }
}
