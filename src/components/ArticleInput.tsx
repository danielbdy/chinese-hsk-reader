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
  initialText: string
  onRead: (article: Article) => void
}

interface FetchResponse {
  url: string
  title: string
  paragraphs: string[]
}

export function ArticleInput({ initialText, onRead }: Props) {
  const [mode, setMode] = useState<'text' | 'link'>('text')
  const [text, setText] = useState(initialText)
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
            if (trimmed) onRead({ text: trimmed })
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
    </div>
  )
}
