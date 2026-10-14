import { useState } from 'react'
import type { Card } from '../lib/cards'

// The exporter pulls in sql.js (about 650 kB), so it loads only when an export button is used.
const loadExporter = () => import('../lib/exportDeck')

interface Props {
  cards: Card[]
  onRemove: (word: string) => void
  onClose: () => void
}

export function SavedWords({ cards, onRemove, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const canShare = typeof navigator.canShare === 'function'

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
        aria-label="Saved words"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 className="sheet__title">Saved words ({cards.length})</h2>
          <button type="button" className="button-link" onClick={onClose}>
            Close
          </button>
        </header>

        {cards.length === 0 ? (
          <p className="sheet__note">Long-press a word in an article and tap “Add to Anki” to save it here.</p>
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
                  <button
                    type="button"
                    className="button-link"
                    aria-label={`Remove ${card.word}`}
                    onClick={() => onRemove(card.word)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="export">
              {canShare && (
                <button
                  type="button"
                  className="button-primary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const { apkgFile, download, share } = await loadExporter()
                      const file = await apkgFile(cards)
                      if (await share(file)) return ''
                      download(file)
                      return 'Your browser cannot share files, so the deck was downloaded instead.'
                    })
                  }
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
                    const { apkgFile, download } = await loadExporter()
                    download(await apkgFile(cards))
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
                    const { download, textFile } = await loadExporter()
                    download(textFile(cards))
                    return 'Text file downloaded. In Anki use File > Import and pick the Basic note type.'
                  })
                }
              >
                Download as text instead
              </button>
            </div>
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
