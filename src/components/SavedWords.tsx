import { useEffect, useState } from 'react'
import { highlight } from '../lib/anki'
import type { Card } from '../lib/cards'
import { download, share } from '../lib/deliver'

// The exporter pulls in sql.js (about 650 kB), so it loads only when the deck is first built.
const loadExporter = () => import('../lib/exportDeck')

// Tells the person the share sheet was blocked, so we fall back to a download without an error.
const isBlocked = (error: unknown) => error instanceof DOMException && error.name === 'NotAllowedError'

interface Props {
  cards: Card[]
  /** How many words the reader marked "Hide pinyin" or "Show pinyin". */
  knownCount: number
  onRemove: (word: string) => void
  onResetMarks: () => void
  onClose: () => void
}

/** The front and back of the Anki card for one word, as the deck will show them. */
function CardPreview({ card }: { card: Card }) {
  return (
    <div className="card-preview">
      <div className="card-preview__label">Front</div>
      <div lang="zh-CN">
        <b>{card.word}</b>
      </div>
      <div lang="zh-CN" dangerouslySetInnerHTML={{ __html: highlight(card.sentence, card.word) }} />
      <div className="card-preview__label">Back</div>
      <div>{card.pinyin}</div>
      <div>{card.meaning}</div>
      <div className="sheet__note">
        {card.hsk !== null && `HSK ${card.hsk} · `}
        {card.source ?? ''}
      </div>
    </div>
  )
}

export function SavedWords({ cards, knownCount, onRemove, onResetMarks, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  // Built ahead of the tap: navigator.share only works while the tap's activation is fresh,
  // so the click handler must not wait on the sql.js build.
  // Remembers which card list the file was built from, so a stale deck is never shared.
  const [built, setBuilt] = useState<{ cards: Card[]; file: File } | null>(null)
  const deck = built?.cards === cards ? built.file : null
  const canShare = typeof navigator.canShare === 'function'

  useEffect(() => {
    let current = true
    loadExporter()
      .then(({ apkgFile }) => apkgFile(cards))
      .then((file) => {
        if (current) setBuilt({ cards, file })
      })
      .catch(() => {
        // The button still builds the deck on tap and reports any error there.
      })
    return () => {
      current = false
    }
  }, [cards])

  const sendToAnki = async (file: File): Promise<string> => {
    setBusy(true)
    setMessage('')
    try {
      const shared = await share(file).catch((error: unknown) => {
        if (isBlocked(error)) return null
        throw error
      })
      if (shared) return ''
      download(file)
      return shared === null
        ? 'The share sheet was blocked, so the deck was downloaded instead. Open the .apkg file with AnkiDroid.'
        : 'Your browser cannot share files, so the deck was downloaded instead.'
    } catch (error) {
      setMessage(`Export failed: ${String(error)}`)
      return ''
    } finally {
      setBusy(false)
    }
  }

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    setMessage('')
    try {
      setMessage(await action())
    } catch (error) {
      setMessage(`Export failed: ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Flashcards"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title">Flashcards ({cards.length})</h2>
          <button type="button" className="button-link" onClick={onClose}>
            Close
          </button>
        </header>

        {knownCount > 0 && (
          <p className="sheet__note saved-marks">
            You changed the pinyin setting for {knownCount} word{knownCount === 1 ? '' : 's'}.{' '}
            <button type="button" className="button-link" onClick={onResetMarks}>
              Reset to HSK level
            </button>
          </p>
        )}

        {cards.length === 0 ? (
          <p className="sheet__note">Tap a word in an article to look it up. It's added here automatically.</p>
        ) : (
          <>
            <ul className="saved-list">
              {cards.map((card) => (
                <li key={card.word}>
                  <span className="saved-list__word" lang="zh-CN">
                    {card.word}
                  </span>
                  <span className="saved-list__detail">
                    <span className="sheet__sense-pinyin">{card.pinyin}</span> {card.meaning}
                  </span>
                  <span
                    className="saved-list__sentence"
                    lang="zh-CN"
                    dangerouslySetInnerHTML={{ __html: highlight(card.sentence, card.word) }}
                  />
                  <span className="saved-list__actions">
                    <button
                      type="button"
                      className="button-link"
                      aria-expanded={open === card.word}
                      onClick={() => setOpen(open === card.word ? null : card.word)}
                    >
                      {open === card.word ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      className="button-link"
                      aria-label={`Remove ${card.word}`}
                      onClick={() => onRemove(card.word)}
                    >
                      Remove
                    </button>
                  </span>
                  {open === card.word && (
                    <div className="saved-list__preview">
                      <CardPreview card={card} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="export">
              {canShare && (
                <button
                  type="button"
                  className="button-primary"
                  disabled={busy}
                  onClick={() => {
                    if (deck) {
                      // No await before share(): the tap is still active here.
                      void sendToAnki(deck)
                      return
                    }
                    run(async () => {
                      const { apkgFile } = await loadExporter()
                      return sendToAnki(await apkgFile(cards))
                    })
                  }}
                >
                  Send to AnkiDroid
                </button>
              )}
              <button
                type="button"
                className={canShare ? 'button-secondary' : 'button-primary'}
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    download(deck ?? (await (await loadExporter()).apkgFile(cards)))
                    return 'Deck downloaded. Open the .apkg file with AnkiDroid (or Anki) to import it.'
                  })
                }
              >
                Download .apkg
              </button>
              <button
                type="button"
                className="button-link"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const { textFile } = await loadExporter()
                    download(textFile(cards))
                    return 'Text file downloaded. In Anki use File > Import and pick the Basic note type.'
                  })
                }
              >
                Text file (for desktop Anki)
              </button>
            </div>
            <ul className="export__help">
              {canShare && <li>Send to AnkiDroid opens your phone's share menu. Pick AnkiDroid there.</li>}
              <li>Download .apkg saves the deck. Open the file with AnkiDroid or Anki to import it.</li>
              <li>Importing again updates words you already have, so nothing is duplicated.</li>
            </ul>
            {message && (
              <p className="sheet__note" role="status">
                {message}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
