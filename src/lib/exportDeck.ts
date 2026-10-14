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

export function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Opens the phone's share sheet with the file (pick AnkiDroid there). Returns false if not supported. */
export async function share(file: File): Promise<boolean> {
  if (!navigator.canShare?.({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title: 'HSK Reader deck' })
  } catch (error) {
    // The person closed the share sheet: nothing to do.
    if (error instanceof DOMException && error.name === 'AbortError') return true
    throw error
  }
  return true
}
