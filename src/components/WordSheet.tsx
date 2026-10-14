import { useEffect } from 'react'
import type { Token, WordData } from '../lib/annotate'
import { lookup } from '../lib/lookup'

interface Props {
  token: Token
  sentence: string
  data: WordData
  showsPinyin: boolean
  saved: boolean
  onToggleSaved: (summary: string) => void
  onToggleKnown: () => void
  onClose: () => void
}

/** Bottom sheet with a word's pinyin, meanings, level and the sentence it came from. */
export function WordSheet({ token, sentence, data, showsPinyin, saved, onToggleSaved, onToggleKnown, onClose }: Props) {
  const result = lookup(token, data)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const at = sentence.indexOf(token.text)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Meaning of ${token.text}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <div>
            <div className="sheet__word" lang="zh-CN">
              {token.text}
            </div>
            <div className="sheet__pinyin">{token.pinyin}</div>
          </div>
          <span className={token.hsk ? 'badge' : 'badge is-muted'}>{token.hsk ? `HSK ${token.hsk}` : 'Not in HSK'}</span>
        </header>

        {!result.whole && <p className="sheet__note">Not in the dictionary as one word. Its parts:</p>}
        {result.entries.map((entry) => (
          <div key={entry.word} className="sheet__entry">
            {!result.whole && (
              <div className="sheet__part" lang="zh-CN">
                {entry.word}
              </div>
            )}
            {entry.senses.length === 0 ? (
              <p className="sheet__note">No dictionary entry.</p>
            ) : (
              <ol className="sheet__senses">
                {entry.senses.slice(0, 3).map((sense) => (
                  <li key={sense.pinyin + sense.meanings[0]}>
                    <span className="sheet__sense-pinyin">{sense.pinyin}</span> {sense.meanings.join('; ')}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}

        <blockquote className="sheet__sentence" lang="zh-CN">
          {at === -1 ? (
            sentence
          ) : (
            <>
              {sentence.slice(0, at)}
              <mark>{token.text}</mark>
              {sentence.slice(at + token.text.length)}
            </>
          )}
        </blockquote>

        <div className="sheet__actions">
          <button type="button" className="button-secondary" onClick={onToggleKnown}>
            {showsPinyin ? 'I know this' : 'Show pinyin'}
          </button>
          <button
            type="button"
            className={saved ? 'button-secondary is-done' : 'button-primary'}
            onClick={() => onToggleSaved(result.summary)}
          >
            {saved ? 'Saved ✓' : 'Add to Anki'}
          </button>
        </div>
      </section>
    </div>
  )
}
