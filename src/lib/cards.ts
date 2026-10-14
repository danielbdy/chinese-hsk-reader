/** A word saved from an article, ready to become an Anki note. */
export interface Card {
  word: string
  pinyin: string
  meaning: string
  hsk: number | null
  /** The sentence the word was found in. */
  sentence: string
  /** Where the word came from: the article's first line. */
  source?: string
  /** ISO timestamp of when it was saved. */
  addedAt: string
}
