import type { Token, WordData } from './annotate'
import { lookup, sensesFor } from './lookup'

const data: WordData = {
  dict: {
    行: [
      ['háng', ['row; line', 'profession']],
      ['xíng', ['to walk', 'OK']],
    ],
    银行: [['yín háng', ['bank (CC-CEDICT)']]],
    铁路: [['tiě lù', ['railroad; railway']]],
    局: [['jú', ['office; bureau', 'situation']]],
  },
  hsk: {
    银行: [3, 'yín háng', ['bank']],
  },
}

const token = (text: string, pinyin: string, lookupWords = [text]): Token => ({
  text,
  pinyin,
  isWord: true,
  hsk: null,
  sentence: 0,
  lookup: lookupWords,
})

describe('sensesFor', () => {
  it('puts the reading used in context first', () => {
    expect(sensesFor('行', data, 'xíng').map((s) => s.pinyin)).toEqual(['xíng', 'háng'])
    expect(sensesFor('行', data, 'háng').map((s) => s.pinyin)).toEqual(['háng', 'xíng'])
  })

  it('prefers the HSK meanings and drops the duplicate CC-CEDICT reading', () => {
    expect(sensesFor('银行', data, 'yín háng')).toEqual([{ pinyin: 'yín háng', meanings: ['bank'] }])
  })

  it('returns nothing for unknown words', () => {
    expect(sensesFor('甲', data)).toEqual([])
  })
})

describe('lookup', () => {
  it('summarises a whole word from its first sense', () => {
    const result = lookup(token('行', 'xíng'), data)
    expect(result.whole).toBe(true)
    expect(result.summary).toBe('to walk; OK')
  })

  it('explains an unknown compound by its pieces', () => {
    const result = lookup(token('铁路局', 'tiě lù jú', ['铁路', '局']), data)
    expect(result.whole).toBe(false)
    expect(result.entries.map((e) => e.word)).toEqual(['铁路', '局'])
    expect(result.summary).toBe('铁路: railroad; railway + 局: office; bureau')
  })
})
