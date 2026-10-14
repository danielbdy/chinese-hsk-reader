import { useEffect, useMemo, useState } from 'react'
import { ArticleInput, type Article } from './components/ArticleInput'
import { LevelPicker } from './components/LevelPicker'
import { Reader } from './components/Reader'
import { SavedWords } from './components/SavedWords'
import { WordSheet } from './components/WordSheet'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWordData } from './hooks/useWordData'
import { analyse, needsPinyin, type Overrides, type Token } from './lib/annotate'
import type { Card } from './lib/cards'
import { lookup } from './lib/lookup'

type TextSize = 's' | 'm' | 'l'
const SIZE_LABEL: Record<TextSize, string> = { s: 'A', m: 'A+', l: 'A++' }
const SIZE_NAME: Record<TextSize, string> = { s: 'Smaller text', m: 'Standard text', l: 'Larger text' }
const RECENT_LIMIT = 5

function App() {
  const wordData = useWordData()
  const [level, setLevel] = useLocalStorage('level', 3)
  const [text, setText] = useLocalStorage('article', '')
  const [source, setSource] = useLocalStorage('source', '')
  const [known, setKnown] = useLocalStorage<string[]>('known', [])
  const [unknown, setUnknown] = useLocalStorage<string[]>('unknown', [])
  const [cards, setCards] = useLocalStorage<Card[]>('cards', [])
  const [history, setHistory] = useLocalStorage<Article[]>('history', [])
  // Off by default: pinyin appears only on words you've tapped. On adds it above every word past your level.
  const [aboveLevel, setAboveLevel] = useLocalStorage('pinyinAboveLevel', false)
  // Words you removed from your flashcards; tapping them again won't add them back.
  const [dismissed, setDismissed] = useLocalStorage<string[]>('dismissed', [])
  const [textSize, setTextSize] = useLocalStorage<TextSize>('textSize', 'm')
  const [editing, setEditing] = useState(text === '')
  const [selected, setSelected] = useState<Token | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [removed, setRemoved] = useState<{ card: Card; index: number } | null>(null)

  // The undo offer goes away on its own after a few seconds.
  useEffect(() => {
    if (!removed) return
    const timer = setTimeout(() => setRemoved(null), 6000)
    return () => clearTimeout(timer)
  }, [removed])

  // Words you've tapped (your flashcards) keep their pinyin in the text.
  const revealed = useMemo(() => new Set(cards.map((c) => c.word)), [cards])

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

  const openArticle = (next: Article) => {
    setText(next.text)
    setSource(next.title ?? '')
    setEditing(false)
    setHistory((list) =>
      [next, ...list.filter((a) => a.text !== next.text)].slice(0, RECENT_LIMIT),
    )
  }

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

  const removeCard = (word: string) => {
    const index = cards.findIndex((c) => c.word === word)
    if (index === -1) return
    setRemoved({ card: cards[index], index })
    setCards((list) => list.filter((c) => c.word !== word))
    setDismissed((list) => [...list.filter((w) => w !== word), word])
  }

  const undoRemove = () => {
    if (!removed) return
    const { card, index } = removed
    setCards((list) => {
      const next = [...list]
      next.splice(Math.min(index, next.length), 0, card)
      return next
    })
    setDismissed((list) => list.filter((w) => w !== card.word))
    setRemoved(null)
  }

  const addCard = (token: Token) => {
    if (wordData.status !== 'ready' || !article) return
    const sentence = article.sentences[token.sentence] ?? ''
    const meaning = lookup(token, wordData.data).summary
    setDismissed((list) => list.filter((w) => w !== token.text))
    setCards((list) => list.some((c) => c.word === token.text) ? list : [
      ...list,
      {
        word: token.text,
        pinyin: token.pinyin,
        meaning,
        hsk: token.hsk,
        sentence,
        source: (source || text.split('\n')[0]).trim().slice(0, 80),
        addedAt: new Date().toISOString(),
      },
    ])
  }

  /** Opening a word shows it and adds it to your flashcards, unless you removed it before. */
  const openWord = (token: Token) => {
    setSelected(token)
    const saved = cards.some((c) => c.word === token.text)
    if (!saved && !dismissed.includes(token.text)) addCard(token)
  }

  const resetMarks = () => {
    setKnown([])
    setUnknown([])
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>HSK Reader</h1>
        <LevelPicker level={level} onChange={setLevel} />
        <button type="button" className="saved-button" onClick={() => setShowSaved(true)}>
          Flashcards ({cards.length})
        </button>
      </header>

      {removed && (
        <div className="undo-banner" role="status">
          <span>Removed {removed.card.word} from flashcards.</span>
          <button type="button" className="button-link" onClick={undoRemove}>
            Undo
          </button>
        </div>
      )}

      {showSaved && (
        <SavedWords
          cards={cards}
          knownCount={known.length + unknown.length}
          onRemove={removeCard}
          onResetMarks={resetMarks}
          onClose={() => setShowSaved(false)}
        />
      )}

      {editing || !text ? (
        <>
          {text && (
            <button type="button" className="button-link back-link" onClick={() => setEditing(false)}>
              ← Back to the article
            </button>
          )}
          <ArticleInput recent={history} onRead={openArticle} onOpenRecent={openArticle} />
        </>
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
            <div className="reader-controls">
              <div className="segmented" role="group" aria-label="Text size">
                {(Object.keys(SIZE_LABEL) as TextSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-label={SIZE_NAME[size]}
                    aria-pressed={textSize === size}
                    className={textSize === size ? 'segmented__option is-active' : 'segmented__option'}
                    onClick={() => setTextSize(size)}
                  >
                    {SIZE_LABEL[size]}
                  </button>
                ))}
              </div>
              <button type="button" className="button-link" onClick={() => setAboveLevel(!aboveLevel)}>
                {`${aboveLevel ? 'Hide' : 'Show'} pinyin above HSK ${level}`}
              </button>
            </div>
            {source && <h2 className="reader-title">{source}</h2>}
            <p className="hint">Tap a word to see its pinyin, meaning and HSK level. It's added to your flashcards.</p>
            <Reader
              article={article}
              level={level}
              overrides={overrides}
              aboveLevel={aboveLevel}
              revealed={revealed}
              size={textSize}
              selected={selected}
              onSelect={openWord}
            />
            {selected && (
              <WordSheet
                token={selected}
                sentence={article.sentences[selected.sentence] ?? ''}
                data={wordData.data}
                showsPinyin={needsPinyin(selected, level, overrides)}
                levelPinyin={aboveLevel}
                saved={cards.some((c) => c.word === selected.text)}
                onAdd={() => addCard(selected)}
                onRemove={() => removeCard(selected.text)}
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
