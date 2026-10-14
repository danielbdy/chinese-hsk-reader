import { needsPinyin, type Article, type Overrides, type Token } from '../lib/annotate'

interface Props {
  article: Article
  level: number
  overrides: Overrides
  onSelect?: (token: Token) => void
}

export function Reader({ article, level, overrides, onSelect }: Props) {
  return (
    <article className="reader" lang="zh-CN">
      {article.paragraphs.map((tokens, p) => (
        <p key={p}>
          {tokens.map((token, i) => {
            if (!token.isWord) return <span key={i}>{token.text}</span>
            const annotated = needsPinyin(token, level, overrides)
            return (
              <span
                key={i}
                className={annotated ? 'word is-unknown' : 'word'}
                data-word={token.text}
                onClick={onSelect ? () => onSelect(token) : undefined}
              >
                {annotated ? (
                  <ruby>
                    {token.text}
                    <rt>{token.pinyin}</rt>
                  </ruby>
                ) : (
                  token.text
                )}
              </span>
            )
          })}
        </p>
      ))}
    </article>
  )
}
