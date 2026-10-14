import { useState } from 'react'
import { errorMessage } from '../lib/readResponse'
import { SAMPLE_ARTICLE } from '../sampleArticle'

export interface Article {
  text: string
  /** Set when the text came from a link; used as the source on saved cards. */
  title?: string
  url?: string
}

interface Props {
  /** Articles read before, newest first. */
  recent: Article[]
  onRead: (article: Article) => void
  onOpenRecent: (article: Article) => void
}

/** A short name for a past article: its title, else its first line. */
const articleName = (article: Article) => (article.title || article.text.split('\n')[0]).trim().slice(0, 60)

interface FetchResponse {
  url: string
  title: string
  paragraphs: string[]
}

export function ArticleInput({ recent, onRead, onOpenRecent }: Props) {
  const [mode, setMode] = useState<'text' | 'link'>('text')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const trimmed = text.trim()

  const fetchLink = async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch(`/api/fetch-article?url=${encodeURIComponent(link.trim())}`)
      if (!res.ok) throw new Error(await errorMessage(res))
      const body = (await res.json()) as FetchResponse
      const article: Article = { text: body.paragraphs.join('\n'), title: body.title, url: body.url }
      setStatus('idle')
      onRead(article)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="article-input">
      <div className="segmented" role="tablist" aria-label="How to add the article">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          className={mode === 'text' ? 'segmented__option is-active' : 'segmented__option'}
          onClick={() => setMode('text')}
        >
          Paste text
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'link'}
          className={mode === 'link' ? 'segmented__option is-active' : 'segmented__option'}
          onClick={() => setMode('link')}
        >
          From a link
        </button>
      </div>

      {mode === 'text' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (trimmed) onRead({ text: trimmed, title: title.trim() || undefined })
          }}
        >
          <label htmlFor="article">Paste a Chinese article</label>
          <textarea
            id="article"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="把中文文章粘贴到这里…"
            rows={10}
            lang="zh-CN"
          />
          <label htmlFor="article-title">Title (optional)</label>
          <input
            id="article-title"
            type="text"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shown above the article and on saved cards"
          />
          <div className="article-input__actions">
            <button type="button" className="button-secondary" onClick={() => setText(SAMPLE_ARTICLE)}>
              Try a sample
            </button>
            <button type="submit" className="button-primary" disabled={!trimmed}>
              Read
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (link.trim() && status !== 'loading') void fetchLink()
          }}
        >
          <label htmlFor="article-link">Link to a Chinese news page</label>
          <input
            id="article-link"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
          <p className="hint">The app fetches the page and keeps its article text. Paywalled pages won't work.</p>
          {status === 'error' && (
            <p className="status is-error" role="alert">
              {error}
            </p>
          )}
          <div className="article-input__actions">
            <span />
            <button type="submit" className="button-primary" disabled={!link.trim() || status === 'loading'}>
              {status === 'loading' ? 'Fetching…' : 'Fetch and read'}
            </button>
          </div>
        </form>
      )}

      {recent.length > 0 && (
        <section className="recent" aria-label="Recent articles">
          <h2 className="recent__title">Recent articles</h2>
          <ul className="recent__list">
            {recent.map((article) => (
              <li key={article.text.slice(0, 200)}>
                <button type="button" className="recent__item" lang="zh-CN" onClick={() => onOpenRecent(article)}>
                  {articleName(article)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
