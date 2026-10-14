import { useEffect, useState } from 'react'
import type { WordData } from '../lib/annotate'
import { loadJieba, type CutFn } from '../lib/segment'
import type { Dictionary, HskList } from '../lib/types'

export type WordDataState =
  | { status: 'loading' }
  | { status: 'ready'; data: WordData; cut: CutFn }
  | { status: 'error'; message: string }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`)
  return (await res.json()) as T
}

/** Loads the dictionary, HSK list and segmenter once, in parallel. */
export function useWordData(): WordDataState {
  const [state, setState] = useState<WordDataState>({ status: 'loading' })
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchJson<Dictionary>('/data/dict.json'),
      fetchJson<HskList>('/data/hsk2.json'),
      loadJieba(),
    ])
      .then(([dict, hsk, cut]) => {
        if (!cancelled) setState({ status: 'ready', data: { dict, hsk }, cut })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: String(error) })
      })
    return () => {
      cancelled = true
    }
  }, [])
  return state
}
