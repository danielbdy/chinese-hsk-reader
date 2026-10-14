// Regenerates data/hsk2.json from the Complete HSK Vocabulary project (MIT licence).
// Run manually when the upstream list changes: node scripts/fetch-hsk.ts
import { writeFileSync } from 'node:fs'

const SOURCE =
  'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.min.json'

interface UpstreamEntry {
  s: string
  l: string[]
  f: { i: { y: string }; m: string[] }[]
}

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Download failed: ${res.status}`)
const upstream = (await res.json()) as UpstreamEntry[]

// word -> [HSK 2.0 level, pinyin, meanings]
const out: Record<string, [number, string, string[]]> = {}
for (const entry of upstream) {
  const levels = entry.l.filter((l) => l.startsWith('o')).map((l) => Number(l.slice(1)))
  if (levels.length === 0) continue
  const form = entry.f[0]
  out[entry.s] = [Math.min(...levels), form.i.y, form.m]
}

const sorted = Object.fromEntries(
  Object.entries(out).sort(([a, x], [b, y]) => x[0] - y[0] || a.localeCompare(b, 'zh')),
)
writeFileSync('data/hsk2.json', JSON.stringify(sorted, null, 0).replaceAll('],"', '],\n"') + '\n')
console.log(`Wrote ${Object.keys(sorted).length} HSK 2.0 words to data/hsk2.json`)
