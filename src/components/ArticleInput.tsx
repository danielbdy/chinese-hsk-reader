import { useState } from 'react'
import { SAMPLE_ARTICLE } from '../sampleArticle'

interface Props {
  initialText: string
  onRead: (text: string) => void
}

export function ArticleInput({ initialText, onRead }: Props) {
  const [text, setText] = useState(initialText)
  const trimmed = text.trim()
  return (
    <form
      className="article-input"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onRead(trimmed)
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
  )
}
