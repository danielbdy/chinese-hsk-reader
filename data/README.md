# Word data sources

| File | Source | Licence |
| --- | --- | --- |
| `hsk2.json` | HSK 2.0 levels 1 to 6 from [Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), regenerated with `node scripts/fetch-hsk.ts` | MIT |
| `public/data/dict.json` (generated, not committed) | [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) via the `cedict-json` npm package, built by `npm run data` | CC BY-SA 4.0 |

Format of `hsk2.json`: `{ "word": [level, "pinyin", ["meaning", …]] }`.
