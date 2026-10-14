import { useLongPress } from '../hooks/useLongPress'
import { needsPinyin, type Article, type Overrides, type Token } from '../lib/annotate'

interface Props {
  article: Article
  level: number
  overrides: Overrides
  /** On: pinyin above every word past the level (with your Hide/Show choices). Off: only on tapped words. */
  aboveLevel: boolean
  /** Words the reader has tapped: they keep their pinyin and show their HSK level. */
  revealed: ReadonlySet<string>
  size: 's' | 'm' | 'l'
  selected: Token | null
  onSelect: (token: Token) => void
}

export function Reader({ article, level, overrides, aboveLevel, revealed, size, selected, onSelect }: Props) {
  const press = useLongPress<HTMLElement>((el) => {
    const token = article.paragraphs[Number(el.dataset.p)]?.[Number(el.dataset.i)]
    if (token) onSelect(token)
  }, '.word')

  return (
    <article className={`reader reader--${size}`} lang="zh-CN" {...press}>
      {article.paragraphs.map((tokens, p) => (
        <p key={p}>
          {tokens.map((token, i) => {
            if (!token.isWord) return <span key={i}>{token.text}</span>
            const tapped = revealed.has(token.text)
            const annotated = aboveLevel ? needsPinyin(token, level, overrides) : tapped
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
                {tapped && token.hsk !== null && (
                  <sup className="word__level" aria-label={`HSK ${token.hsk}`}>
                    {token.hsk}
                  </sup>
                )}
              </span>
            )
          })}
        </p>
      ))}
    </article>
  )
}
