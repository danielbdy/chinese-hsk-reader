import { useMemo, useState } from 'react'
import { ArticleInput } from './components/ArticleInput'
import { LevelPicker } from './components/LevelPicker'
import { Reader } from './components/Reader'
import { SavedWords } from './components/SavedWords'
import { WordSheet } from './components/WordSheet'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWordData } from './hooks/useWordData'
import { analyse, needsPinyin, type Overrides, type Token } from './lib/annotate'
import type { Card } from './lib/cards'

function App() {
  const wordData = useWordData()
  const [level, setLevel] = useLocalStorage('level', 3)
  const [text, setText] = useLocalStorage('article', '')
  const [known, setKnown] = useLocalStorage<string[]>('known', [])
  const [unknown, setUnknown] = useLocalStorage<string[]>('unknown', [])
  const [cards, setCards] = useLocalStorage<Card[]>('cards', [])
  const [editing, setEditing] = useState(text === '')
  const [selected, setSelected] = useState<Token | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  const overrides: Overrides = useMemo(
    () => ({ known: new Set(known), unknown: new Set(unknown) }),
    [known, unknown],
  )

  const article = useMemo(
    () => (wordData.status === 'ready' && text ? analyse(text, wordData.cut, wordData.data) : null),
    [wordData, text],
  )

  const stats = useMemo(() => {
    if (!article) return null
    const words = article.paragraphs.flat().filter((t) => t.isWord)
    const unknownCount = words.filter((t) => needsPinyin(t, level, overrides)).length
    return { words: words.length, unknown: unknownCount }
  }, [article, level, overrides])

  const toggleKnown = (token: Token) => {
    const word = token.text
    const without = (list: string[]) => list.filter((w) => w !== word)
    if (needsPinyin(token, level, overrides)) {
      setUnknown(without)
      // Only record an override when the HSK rule alone would still show pinyin.
      if (needsPinyin(token, level)) setKnown((list) => [...without(list), word])
    } else {
      setKnown(without)
      if (!needsPinyin(token, level)) setUnknown((list) => [...without(list), word])
    }
  }

  const toggleSaved = (token: Token, sentence: string, meaning: string) => {
    setCards((list) =>
      list.some((c) => c.word === token.text)
        ? list.filter((c) => c.word !== token.text)
        : [
            ...list,
            {
              word: token.text,
              pinyin: token.pinyin,
              meaning,
              hsk: token.hsk,
              sentence,
              source: text.split('\n')[0].trim().slice(0, 60),
              addedAt: new Date().toISOString(),
            },
          ],
    )
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>HSK Reader</h1>
        <LevelPicker level={level} onChange={setLevel} />
        <button type="button" className="saved-button" onClick={() => setShowSaved(true)}>
          Saved ({cards.length})
        </button>
      </header>

      {showSaved && (
        <SavedWords
          cards={cards}
          onRemove={(word) => setCards((list) => list.filter((c) => c.word !== word))}
          onClose={() => setShowSaved(false)}
        />
      )}

      {editing || !text ? (
        <ArticleInput
          initialText={text}
          onRead={(t) => {
            setText(t)
            setEditing(false)
          }}
        />
      ) : wordData.status === 'loading' ? (
        <p className="status">Loading the dictionary…</p>
      ) : wordData.status === 'error' ? (
        <p className="status is-error">Something went wrong loading word data: {wordData.message}</p>
      ) : (
        article && (
          <>
            <div className="reader-toolbar">
              {stats && (
                <span className="reader-stats">
                  {stats.unknown} of {stats.words} words above HSK {level}
                </span>
              )}
              <button type="button" className="button-secondary" onClick={() => setEditing(true)}>
                New article
              </button>
            </div>
            <p className="hint">Long-press a word (or click it on a computer) to see its meaning.</p>
            <Reader
              article={article}
              level={level}
              overrides={overrides}
              selected={selected}
              onSelect={setSelected}
            />
            {selected && (
              <WordSheet
                token={selected}
                sentence={article.sentences[selected.sentence] ?? ''}
                data={wordData.data}
                showsPinyin={needsPinyin(selected, level, overrides)}
                saved={cards.some((c) => c.word === selected.text)}
                onToggleSaved={(meaning) =>
                  toggleSaved(selected, article.sentences[selected.sentence] ?? '', meaning)
                }
                onToggleKnown={() => toggleKnown(selected)}
                onClose={() => setSelected(null)}
              />
            )}
          </>
        )
      )}
    </main>
  )
}

export default App
