import { useMemo, useState } from 'react'
import { ArticleInput } from './components/ArticleInput'
import { LevelPicker } from './components/LevelPicker'
import { Reader } from './components/Reader'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWordData } from './hooks/useWordData'
import { analyse, needsPinyin, type Overrides } from './lib/annotate'

const NO_OVERRIDES: Overrides = { known: new Set(), unknown: new Set() }

function App() {
  const wordData = useWordData()
  const [level, setLevel] = useLocalStorage('level', 3)
  const [text, setText] = useLocalStorage('article', '')
  const [editing, setEditing] = useState(text === '')

  const article = useMemo(
    () => (wordData.status === 'ready' && text ? analyse(text, wordData.cut, wordData.data) : null),
    [wordData, text],
  )

  const stats = useMemo(() => {
    if (!article) return null
    const words = article.paragraphs.flat().filter((t) => t.isWord)
    const unknown = words.filter((t) => needsPinyin(t, level, NO_OVERRIDES)).length
    return { words: words.length, unknown }
  }, [article, level])

  return (
    <main className="app">
      <header className="app-header">
        <h1>HSK Reader</h1>
        <LevelPicker level={level} onChange={setLevel} />
      </header>

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
            <Reader article={article} level={level} overrides={NO_OVERRIDES} />
          </>
        )
      )}
    </main>
  )
}

export default App
