/** One reading of a word in CC-CEDICT: tone-marked pinyin and English meanings. */
export type Reading = [pinyin: string, meanings: string[]]

/** Simplified word -> its CC-CEDICT readings. Built by scripts/build-data.ts. */
export type Dictionary = Record<string, Reading[]>

/** Simplified word -> [HSK 2.0 level, pinyin, meanings]. Source: data/hsk2.json. */
export type HskList = Record<string, [level: number, pinyin: string, meanings: string[]]>
