// Writes a sample deck to the given path, for checking an export by hand or with verify-apkg.py.
// Usage: node scripts/sample-apkg.ts sample.apkg
import { writeFileSync } from 'node:fs'
import initSqlJs from 'sql.js'
import { buildApkg } from '../src/lib/anki.ts'
import type { Card } from '../src/lib/cards.ts'

const cards: Card[] = [
  { word: '升级', pinyin: 'shēng jí', meaning: 'to upgrade', hsk: null, sentence: '12306平台将从购票服务升级为全行程智能服务。', source: 'Sample', addedAt: new Date().toISOString() },
  { word: '规划', pinyin: 'guī huà', meaning: 'plan; program', hsk: 6, sentence: '国家铁路局发布了规划。', source: 'Sample', addedAt: new Date().toISOString() },
]

const path = process.argv[2] ?? 'sample.apkg'
writeFileSync(path, await buildApkg(cards, await initSqlJs()))
console.log(`Wrote ${cards.length} cards to ${path}`)
