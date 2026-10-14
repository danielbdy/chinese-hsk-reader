import { useLongPress } from '../hooks/useLongPress'
import { needsPinyin, type Article, type Overrides, type Token } from '../lib/annotate'

interface Props {
  article: Article
  level: number
  overrides: Overrides
  selected: Token | null
  onSelect: (token: Token) => void
}

export function Reader({ article, level, overrides, selected, onSelect }: Props) {
  const press = useLongPress<HTMLElement>((el) => {
    const token = article.paragraphs[Number(el.dataset.p)]?.[Number(el.dataset.i)]
    if (token) onSelect(token)
  }, '.word')

  return (
    <article className="reader" lang="zh-CN" {...press}>
      {article.paragraphs.map((tokens, p) => (
        <p key={p}>
          {tokens.map((token, i) => {
            if (!token.isWord) return <span key={i}>{token.text}</span>
            const annotated = needsPinyin(token, level, overrides)
            const classes = ['word', annotated && 'is-unknown', token === selected && 'is-selected']
            return (
              <span
                key={i}
                className={classes.filter(Boolean).join(' ')}
                data-word={token.text}
                data-p={p}
                data-i={i}
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
