import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { buildAnkiText, buildApkg } from './anki'
import type { Card } from './cards'

const fileName = (ext: string) => `hsk-reader-${new Date().toISOString().slice(0, 10)}.${ext}`

export async function apkgFile(cards: readonly Card[]): Promise<File> {
  // sql.js is only needed for export, so it loads on first use.
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  const bytes = await buildApkg(cards, SQL)
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName('apkg'), { type: 'application/octet-stream' })
}

export function textFile(cards: readonly Card[]): File {
  return new File([buildAnkiText(cards)], fileName('txt'), { type: 'text/plain' })
}
