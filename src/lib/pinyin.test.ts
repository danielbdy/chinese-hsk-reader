import { numberedToMarks, syllableToMarks } from './pinyin'

describe('syllableToMarks', () => {
  it.each([
    ['ma1', 'mā'],
    ['hao3', 'hǎo'],
    ['xie4', 'xiè'],
    ['dou1', 'dōu'],
    ['gui4', 'guì'],
    ['liu2', 'liú'],
    ['lu:4', 'lǜ'],
    ['nu:e4', 'nüè'],
    ['de5', 'de'],
    ['r5', 'r'],
    ['Zhong1', 'Zhōng'],
    ['A1', 'Ā'],
    ['xx5', 'xx'],
    ['m2', 'm'],
  ])('%s becomes %s', (input, expected) => {
    expect(syllableToMarks(input)).toBe(expected)
  })

  it('leaves non-syllables alone', () => {
    expect(syllableToMarks('·')).toBe('·')
    expect(syllableToMarks('A')).toBe('A')
  })
})

describe('numberedToMarks', () => {
  it('converts a whole word', () => {
    expect(numberedToMarks('yin2 hang2')).toBe('yín háng')
  })
})
