import { strToU8, zipSync } from 'fflate'
import type { SqlJsStatic } from 'sql.js'
import type { Card } from './cards.ts'

// Fixed ids so re-importing a newer export updates the same note type and deck in Anki
// instead of creating copies. Notes are matched by a guid derived from the word.
export const MODEL_ID = 1728900000001
export const DECK_ID = 1728900000002
export const DECK_NAME = 'HSK Reader'
export const FIELDS = ['Hanzi', 'Pinyin', 'Meaning', 'HSK', 'Sentence', 'Source'] as const

const FRONT = `<div class="hanzi">{{Hanzi}}</div>
<div class="sentence">{{Sentence}}</div>`

const BACK = `{{FrontSide}}
<hr id="answer">
<div class="pinyin">{{Pinyin}}</div>
<div class="meaning">{{Meaning}}</div>
<div class="meta">{{#HSK}}HSK {{HSK}} · {{/HSK}}{{Source}}</div>`

const CSS = `.card { font-family: system-ui, sans-serif; font-size: 20px; text-align: center; color: #1f2328; background: #fbfaf6; }
.hanzi { font-size: 56px; margin: 16px 0; }
.sentence { font-size: 22px; color: #5c6370; }
.sentence b { color: #b91c1c; }
.pinyin { font-size: 28px; color: #9a3412; margin: 8px 0; }
.meaning { font-size: 20px; }
.meta { font-size: 14px; color: #5c6370; margin-top: 16px; }
.nightMode .card, .night_mode .card { color: #e6e6e6; background: #1e1e1e; }`

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, type integer not null, ivl integer not null, factor integer not null, time integer not null, lastIvl integer not null, ease integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
`

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** The sentence as HTML with the saved word in bold. */
export function highlight(sentence: string, word: string): string {
  const at = sentence.indexOf(word)
  if (at === -1) return escapeHtml(sentence)
  return (
    escapeHtml(sentence.slice(0, at)) +
    `<b>${escapeHtml(word)}</b>` +
    escapeHtml(sentence.slice(at + word.length))
  )
}

export function noteFields(card: Card): string[] {
  return [
    escapeHtml(card.word),
    escapeHtml(card.pinyin),
    escapeHtml(card.meaning),
    card.hsk === null ? '' : String(card.hsk),
    highlight(card.sentence, card.word),
    escapeHtml(card.source ?? ''),
  ]
}

async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', strToU8(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Anki's note checksum: the first 8 hex digits of the SHA-1 of the sort field, as an integer. */
export async function fieldChecksum(field: string): Promise<number> {
  return parseInt((await sha1Hex(field)).slice(0, 8), 16)
}

/** A stable guid per word, so re-importing updates the note instead of duplicating it. */
export async function noteGuid(word: string): Promise<string> {
  return (await sha1Hex(`hsk-reader:${word}`)).slice(0, 10)
}

function collectionJson(nowSec: number) {
  const model = {
    id: MODEL_ID,
    name: 'HSK Reader word',
    type: 0,
    mod: nowSec,
    usn: -1,
    sortf: 0,
    did: DECK_ID,
    tmpls: [{ name: 'Recognise', ord: 0, qfmt: FRONT, afmt: BACK, did: null, bqfmt: '', bafmt: '' }],
    flds: FIELDS.map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] })),
    css: CSS,
    latexPre:
      '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
    latexPost: '\\end{document}',
    latexsvg: false,
    req: [[0, 'any', [0]]],
    tags: [],
    vers: [],
  }
  const deck = (id: number, name: string) => ({
    id,
    name,
    mod: nowSec,
    usn: -1,
    lrnToday: [0, 0],
    revToday: [0, 0],
    newToday: [0, 0],
    timeToday: [0, 0],
    collapsed: false,
    browserCollapsed: false,
    desc: '',
    dyn: 0,
    conf: 1,
    extendNew: 0,
    extendRev: 0,
  })
  const dconf = {
    id: 1,
    name: 'Default',
    mod: 0,
    usn: 0,
    maxTaken: 60,
    autoplay: true,
    timer: 0,
    replayq: true,
    dyn: false,
    new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 0], order: 1, perDay: 20 },
    lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
    rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
  }
  const conf = {
    activeDecks: [1],
    curDeck: 1,
    newSpread: 0,
    collapseTime: 1200,
    timeLim: 0,
    estTimes: true,
    dueCounts: true,
    curModel: MODEL_ID,
    nextPos: 1,
    sortType: 'noteFld',
    sortBackwards: false,
    addToCur: true,
  }
  return {
    conf: JSON.stringify(conf),
    models: JSON.stringify({ [MODEL_ID]: model }),
    decks: JSON.stringify({ 1: deck(1, 'Default'), [DECK_ID]: deck(DECK_ID, DECK_NAME) }),
    dconf: JSON.stringify({ 1: dconf }),
  }
}

/** Builds an Anki package (.apkg) with one "HSK Reader word" note per saved card. */
export async function buildApkg(cards: readonly Card[], SQL: SqlJsStatic, now = new Date()): Promise<Uint8Array> {
  const nowMs = now.getTime()
  const nowSec = Math.floor(nowMs / 1000)
  const db = new SQL.Database()
  try {
    db.run(SCHEMA)
    const json = collectionJson(nowSec)
    db.run('INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, ?)', [
      nowSec,
      nowMs,
      nowMs,
      json.conf,
      json.models,
      json.decks,
      json.dconf,
      '{}',
    ])

    for (const [i, card] of cards.entries()) {
      const fields = noteFields(card)
      const id = nowMs + i
      db.run('INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, ?)', [
        id,
        await noteGuid(card.word),
        MODEL_ID,
        nowSec,
        ' hsk-reader ',
        fields.join('\x1f'),
        fields[0],
        await fieldChecksum(card.word),
        '',
      ])
      db.run('INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?)', [
        id,
        id,
        DECK_ID,
        nowSec,
        i + 1,
        '',
      ])
    }

    return zipSync({ 'collection.anki2': db.export(), media: strToU8('{}') })
  } finally {
    db.close()
  }
}

/** Tab-separated text Anki can import directly (File > Import), as a fallback to the .apkg. */
export function buildAnkiText(cards: readonly Card[]): string {
  const header = [
    '#separator:tab',
    '#html:true',
    `#notetype:Basic`,
    `#deck:${DECK_NAME}`,
    `#columns:Front\tBack`,
  ]
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, ' ')
  const rows = cards.map((card) => {
    const [hanzi, pinyin, meaning, hsk, sentence, source] = noteFields(card).map(clean)
    const front = `${hanzi}<br><small>${sentence}</small>`
    const back = `${pinyin}<br>${meaning}${hsk ? `<br><small>HSK ${hsk}</small>` : ''}${source ? `<br><small>${source}</small>` : ''}`
    return `${front}\t${back}`
  })
  return [...header, ...rows].join('\n') + '\n'
}
