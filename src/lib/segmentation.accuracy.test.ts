// @vitest-environment node
import { readFileSync } from 'node:fs'
import cedict from 'cedict-json'
import { cut } from 'jieba-wasm'
import { analyse, type WordData } from './annotate'
import { buildDictionary } from './buildDictionary'
import type { HskList } from './types'

const data: WordData = {
  dict: buildDictionary(cedict),
  hsk: JSON.parse(readFileSync('data/hsk2.json', 'utf8')) as HskList,
}

const gold = readFileSync('src/test/fixtures/news-sample.txt', 'utf8')
  .trim()
  .split('\n')
  .map((line) => line.split('|'))

/** Character spans ("start:end") of each word, so two segmentations can be compared. */
function spans(words: string[]): Set<string> {
  const result = new Set<string>()
  let start = 0
  for (const word of words) {
    const end = start + Array.from(word).length
    result.add(`${start}:${end}`)
    start = end
  }
  return result
}

describe('segmentation on the news sample', () => {
  const pairs = gold.map((words) => {
    const article = analyse(words.join(''), (text) => cut(text, true), data)
    const tokens = article.paragraphs[0]
    return { gold: words, ours: tokens.map((t) => t.text), tokens }
  })

  it('keeps every character', () => {
    for (const { gold, ours } of pairs) expect(ours.join('')).toBe(gold.join(''))
  })

  it('scores at least 95% F1 against the hand-segmented reference (PRD target)', () => {
    let correct = 0
    let goldCount = 0
    let oursCount = 0
    for (const pair of pairs) {
      const g = spans(pair.gold)
      const o = spans(pair.ours)
      goldCount += g.size
      oursCount += o.size
      for (const span of o) if (g.has(span)) correct++
    }
    const precision = correct / oursCount
    const recall = correct / goldCount
    const f1 = (2 * precision * recall) / (precision + recall)
    console.info(`Segmentation F1 ${(f1 * 100).toFixed(1)}% (precision ${(precision * 100).toFixed(1)}%, recall ${(recall * 100).toFixed(1)}%)`)
    expect(f1).toBeGreaterThanOrEqual(0.95)
  })

  it('finds an English meaning for at least 98% of Chinese words (PRD target)', () => {
    const tokens = pairs.flatMap((p) => p.tokens).filter((t) => t.isWord)
    const whole = tokens.filter((t) => t.text in data.dict || t.text in data.hsk).length
    const glossed = tokens.filter((t) => t.lookup.every((w) => w in data.dict || w in data.hsk)).length
    console.info(`Whole-word dictionary hits ${whole}/${tokens.length}; glossed (whole or by pieces) ${glossed}/${tokens.length}`)
    expect(glossed / tokens.length).toBeGreaterThanOrEqual(0.98)
  })
})
