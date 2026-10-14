import { pinyin } from 'pinyin-pro'
import type { CutFn } from './segment'
import type { Dictionary, HskList } from './types'

export interface Token {
  /** The word or text run exactly as it appears in the article. */
  text: string
  /** True when the token contains Chinese characters and can be looked up. */
  isWord: boolean
  /** Pinyin for this word in context, with tone marks. Empty for non-Chinese text. */
  pinyin: string
  /** HSK 2.0 level (1 to 6), or null when the word is not on the HSK list. */
  hsk: number | null
  /** Index into Article.sentences of the sentence this token belongs to. */
  sentence: number
  /**
   * Dictionary words to look up for this token: the token itself, or its pieces when the
   * dictionary doesn't know the whole word (铁路局 is looked up as 铁路 + 局).
   */
  lookup: string[]
}

export interface Article {
  /** One array of tokens per paragraph. */
  paragraphs: Token[][]
  sentences: string[]
}

export interface WordData {
  dict: Dictionary
  hsk: HskList
}

const HAN = /\p{Script=Han}/u
const SENTENCE_END = /[。！？!?；;…]/

/**
 * Splits a word jieba produced but the dictionary doesn't know (such as 铁路局 or 购票)
 * into the longest dictionary words, so every piece can be looked up.
 * The word stays whole on the page; only its lookup uses the pieces.
 */
export function splitUnknown(word: string, data: WordData): string[] {
  if (word in data.dict || word in data.hsk) return [word]
  const chars = Array.from(word)
  const parts: string[] = []
  let i = 0
  while (i < chars.length) {
    let end = chars.length
    while (end > i + 1) {
      const candidate = chars.slice(i, end).join('')
      if (candidate in data.dict || candidate in data.hsk) break
      end--
    }
    parts.push(chars.slice(i, end).join(''))
    i = end
  }
  return parts
}

/** Segments an article into paragraphs of tokens with in-context pinyin and HSK levels. */
export function analyse(text: string, cut: CutFn, data: WordData): Article {
  const sentences: string[] = []
  const paragraphs: Token[][] = []

  for (const paragraph of text.split(/\r?\n/)) {
    if (paragraph.trim() === '') continue
    // pinyin-pro reads the whole paragraph so characters with several readings get the right one.
    const charPinyin = pinyin(paragraph, { type: 'all' }).map((c) => (c.isZh ? c.pinyin : ''))
    const tokens: Token[] = []
    let charIndex = 0
    let sentenceText = ''

    for (const word of cut(paragraph)) {
      const length = Array.from(word).length
      const isWord = HAN.test(word)
      tokens.push({
        text: word,
        isWord,
        pinyin: isWord ? charPinyin.slice(charIndex, charIndex + length).filter(Boolean).join(' ') : '',
        hsk: data.hsk[word]?.[0] ?? null,
        sentence: sentences.length,
        lookup: isWord ? splitUnknown(word, data) : [],
      })
      charIndex += length
      sentenceText += word
      if (SENTENCE_END.test(word)) {
        sentences.push(sentenceText.trim())
        sentenceText = ''
      }
    }
    if (sentenceText.trim() !== '') sentences.push(sentenceText.trim())
    paragraphs.push(tokens)
  }

  return { paragraphs, sentences }
}

export interface Overrides {
  known: ReadonlySet<string>
  unknown: ReadonlySet<string>
}

/** True when the reader should see pinyin above this token at the chosen HSK level. */
export function needsPinyin(token: Token, level: number, overrides?: Overrides): boolean {
  if (!token.isWord) return false
  if (overrides?.known.has(token.text)) return false
  if (overrides?.unknown.has(token.text)) return true
  return token.hsk === null || token.hsk > level
}
