// @vitest-environment node
import { unzipSync, strFromU8 } from 'fflate'
import initSqlJs from 'sql.js'
import { buildAnkiText, buildApkg, DECK_ID, fieldChecksum, highlight, MODEL_ID, noteGuid } from './anki'
import type { Card } from './cards'

const cards: Card[] = [
  {
    word: '升级',
    pinyin: 'shēng jí',
    meaning: 'to upgrade',
    hsk: null,
    sentence: '12306平台将从购票服务升级为全行程智能服务。',
    source: '铁路出行将有这些新变化',
    addedAt: '2026-10-14T00:00:00Z',
  },
  {
    word: '规划',
    pinyin: 'guī huà',
    meaning: 'plan; program',
    hsk: 6,
    sentence: '国家铁路局发布了<规划>。',
    addedAt: '2026-10-14T00:00:00Z',
  },
]

describe('highlight', () => {
  it('bolds the word and escapes the rest', () => {
    expect(highlight('发布了<规划>。', '规划')).toBe('发布了&lt;<b>规划</b>&gt;。')
  })
})

describe('noteGuid and fieldChecksum', () => {
  it('are stable for the same word', async () => {
    expect(await noteGuid('升级')).toBe(await noteGuid('升级'))
    expect(await noteGuid('升级')).not.toBe(await noteGuid('规划'))
    expect(await fieldChecksum('a')).toBe(0x86f7e437) // sha1("a") = 86f7e437…
  })
})

describe('buildApkg', () => {
  it('writes a collection with one note and one new card per word', async () => {
    const SQL = await initSqlJs()
    const zip = unzipSync(await buildApkg(cards, SQL, new Date('2026-10-14T00:00:00Z')))
    expect(Object.keys(zip).sort()).toEqual(['collection.anki2', 'media'])
    expect(strFromU8(zip.media)).toBe('{}')

    const db = new SQL.Database(zip['collection.anki2'])
    const notes = db.exec('SELECT mid, flds, sfld FROM notes ORDER BY id')[0].values
    expect(notes).toHaveLength(2)
    expect(notes[0][0]).toBe(MODEL_ID)
    expect(String(notes[0][1]).split('\x1f')).toEqual([
      '升级',
      'shēng jí',
      'to upgrade',
      '',
      '12306平台将从购票服务<b>升级</b>为全行程智能服务。',
      '铁路出行将有这些新变化',
    ])
    expect(String(notes[1][1]).split('\x1f')[3]).toBe('6')

    const cardRows = db.exec('SELECT did, type, queue FROM cards')[0].values
    expect(cardRows).toEqual([
      [DECK_ID, 0, 0],
      [DECK_ID, 0, 0],
    ])
    const decks = JSON.parse(String(db.exec('SELECT decks FROM col')[0].values[0][0]))
    expect(decks[DECK_ID].name).toBe('HSK Reader')
    db.close()
  })
})

describe('buildAnkiText', () => {
  it('writes a tab-separated import file with Anki header lines', () => {
    const lines = buildAnkiText(cards).trim().split('\n')
    expect(lines[0]).toBe('#separator:tab')
    expect(lines).toHaveLength(7)
    expect(lines[5].split('\t')).toHaveLength(2)
  })
})
