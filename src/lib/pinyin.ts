const TONE_MARKS: Record<string, string> = {
  a: 'āáǎà',
  e: 'ēéěè',
  i: 'īíǐì',
  o: 'ōóǒò',
  u: 'ūúǔù',
  ü: 'ǖǘǚǜ',
}

/** Converts one CC-CEDICT syllable such as "lu:4" or "Zhong1" to tone-marked pinyin ("lǜ", "Zhōng"). */
export function syllableToMarks(syllable: string): string {
  const match = /^([a-zA-Z:]+)([1-5])$/.exec(syllable)
  if (!match) return syllable.replace(/u:/g, 'ü').replace(/U:/g, 'Ü')
  const letters = match[1].replace(/u:/g, 'ü').replace(/U:/g, 'Ü')
  const tone = Number(match[2])
  if (tone === 5) return letters

  const lower = letters.toLowerCase()
  // Standard placement: a or e takes the mark, then o in "ou", otherwise the last vowel.
  let index = lower.search(/[ae]/)
  if (index === -1) index = lower.indexOf('ou')
  if (index === -1) {
    for (let i = lower.length - 1; i >= 0; i--) {
      if ('iouü'.includes(lower[i])) {
        index = i
        break
      }
    }
  }
  if (index === -1) return letters

  const vowel = lower[index]
  let marked = TONE_MARKS[vowel][tone - 1]
  if (letters[index] !== vowel) marked = marked.toUpperCase()
  return letters.slice(0, index) + marked + letters.slice(index + 1)
}

/** Converts CC-CEDICT numbered pinyin ("yin2 hang2") to tone marks ("yín háng"). */
export function numberedToMarks(pinyin: string): string {
  return pinyin.split(' ').map(syllableToMarks).join(' ')
}
