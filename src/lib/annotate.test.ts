import { analyse, needsPinyin, splitUnknown, type WordData } from './annotate'

const data: WordData = {
  dict: {
    银行: [['yín háng', ['bank']]],
    我: [['wǒ', ['I; me']]],
    去: [['qù', ['to go']]],
    铁路: [['tiě lù', ['railroad']]],
    局: [['jú', ['office; bureau']]],
  },
  hsk: {
    我: [1, 'wǒ', ['I']],
    去: [1, 'qù', ['to go']],
    银行: [3, 'yín háng', ['bank']],
  },
}

const cutBy = (words: string[]) => () => words

describe('splitUnknown', () => {
  it('keeps known words whole', () => {
    expect(splitUnknown('银行', data)).toEqual(['银行'])
  })

  it('splits an unknown word into the longest known pieces', () => {
    expect(splitUnknown('铁路局', data)).toEqual(['铁路', '局'])
  })

  it('falls back to single characters', () => {
    expect(splitUnknown('甲乙', data)).toEqual(['甲', '乙'])
  })
})

describe('analyse', () => {
  it('gives each word its HSK level and in-context pinyin', () => {
    const article = analyse('我去银行。', cutBy(['我', '去', '银行', '。']), data)
    const [tokens] = article.paragraphs
    expect(tokens.map((t) => [t.text, t.pinyin, t.hsk])).toEqual([
      ['我', 'wǒ', 1],
      ['去', 'qù', 1],
      ['银行', 'yín háng', 3],
      ['。', '', null],
    ])
    expect(article.sentences).toEqual(['我去银行。'])
  })

  it('tracks sentences and paragraphs', () => {
    const cut = (text: string) => Array.from(text)
    const article = analyse('我去。我去！\n\n去', cut, data)
    expect(article.paragraphs).toHaveLength(2)
    expect(article.sentences).toEqual(['我去。', '我去！', '去'])
    expect(article.paragraphs[1][0].sentence).toBe(2)
  })

  it('keeps unknown compounds whole but looks them up by their pieces', () => {
    const article = analyse('铁路局', cutBy(['铁路局']), data)
    expect(article.paragraphs[0][0]).toMatchObject({ text: '铁路局', pinyin: 'tiě lù jú', lookup: ['铁路', '局'] })
  })

  it('passes numbers and Latin text through without pinyin', () => {
    const article = analyse('CR450', cutBy(['CR450']), data)
    expect(article.paragraphs[0][0]).toMatchObject({ isWord: false, pinyin: '' })
  })
})

describe('needsPinyin', () => {
  const token = (text: string, hsk: number | null) => ({ text, isWord: true, pinyin: '', hsk, sentence: 0, lookup: [text] })

  it('shows pinyin only above the chosen level', () => {
    expect(needsPinyin(token('银行', 3), 3)).toBe(false)
    expect(needsPinyin(token('银行', 3), 2)).toBe(true)
  })

  it('shows pinyin for words not on the HSK list', () => {
    expect(needsPinyin(token('铁路', null), 6)).toBe(true)
  })

  it('never shows pinyin for punctuation or numbers', () => {
    expect(needsPinyin({ ...token('。', null), isWord: false }, 1)).toBe(false)
  })

  it('lets personal overrides win over the HSK list', () => {
    const overrides = { known: new Set(['铁路']), unknown: new Set(['我']) }
    expect(needsPinyin(token('铁路', null), 3, overrides)).toBe(false)
    expect(needsPinyin(token('我', 1), 3, overrides)).toBe(true)
  })
})
