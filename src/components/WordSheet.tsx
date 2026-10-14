import { useEffect, useRef } from 'react'
import type { Token, WordData } from '../lib/annotate'
import { lookup } from '../lib/lookup'

interface Props {
  token: Token
  sentence: string
  data: WordData
  showsPinyin: boolean
  /** True when the page shows pinyin by HSK level; only then can a word be marked known. */
  levelPinyin: boolean
  saved: boolean
  onAdd: () => void
  onRemove: () => void
  onToggleKnown: () => void
  onClose: () => void
}

/** Bottom sheet with a word's pinyin, meanings, level and the sentence it came from. */
export function WordSheet({
  token,
  sentence,
  data,
  showsPinyin,
  levelPinyin,
  saved,
  onAdd,
  onRemove,
  onToggleKnown,
  onClose,
}: Props) {
  const result = lookup(token, data)
  const sheet = useRef<HTMLElement>(null)

  // Move focus into the sheet for keyboard and screen reader users, and give it back on close.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    sheet.current?.focus()
    return () => previous?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const at = sentence.indexOf(token.text)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        ref={sheet}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Meaning of ${token.text}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <div>
            <div className="sheet__word" lang="zh-CN">
              {token.text}
            </div>
            <div className="sheet__pinyin">{token.pinyin}</div>
          </div>
          <span className={token.hsk ? 'badge sheet__level' : 'badge sheet__level is-muted'}>
            {token.hsk ? `HSK ${token.hsk}` : 'Not in HSK'}
          </span>
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

        <p className="sheet__note" role="status">
          {saved ? 'Added to your flashcards ✓' : 'Not in your flashcards.'}
        </p>
        <div className="sheet__actions">
          {levelPinyin && (
            <button type="button" className="button-secondary" onClick={onToggleKnown}>
              {showsPinyin ? 'Hide pinyin' : 'Show pinyin'}
            </button>
          )}
          {saved ? (
            <button type="button" className="button-secondary" onClick={onRemove}>
              Remove from flashcards
            </button>
          ) : (
            <button type="button" className="button-primary" onClick={onAdd}>
              Add to flashcards
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
