// Builds the word data the app loads at runtime into public/data/.
// Run with: npm run data (also runs automatically before dev and build).
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import cedict from 'cedict-json'
import { buildDictionary } from '../src/lib/buildDictionary.ts'

const dict = buildDictionary(cedict)

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/dict.json', JSON.stringify(dict))
copyFileSync('data/hsk2.json', 'public/data/hsk2.json')
console.log(`Wrote ${Object.keys(dict).length} dictionary words to public/data/dict.json`)
