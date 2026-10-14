import { parse, type HTMLElement } from 'node-html-parser'

export interface ExtractedArticle {
  title: string
  paragraphs: string[]
}

const HAN = /\p{Script=Han}/u
/** Shortest paragraph kept: skips captions, bylines and "share" links. */
const MIN_HAN_CHARS = 12

/** Reads the charset from a Content-Type header, then from a <meta> tag, defaulting to UTF-8. */
export function decodeHtml(bytes: Uint8Array, contentType: string | null): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1]
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 2048))
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1]
  const label = fromHeader ?? fromMeta ?? 'utf-8'
  try {
    return new TextDecoder(label, { fatal: false }).decode(bytes)
  } catch {
    // Unknown label: fall back to UTF-8, which is what most sites send.
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Pulls the title and body paragraphs from a news page. Prefers an <article> element when there is
 * one, keeps paragraphs with enough Chinese text, and drops duplicates.
 */
export function extractArticle(html: string): ExtractedArticle {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } })
  root.querySelectorAll('script, style, noscript, nav, footer, header, aside, form').forEach((el) => el.remove())

  const title = cleanText(
    root.querySelector('meta[property="og:title"]')?.getAttribute('content') ??
      root.querySelector('h1')?.text ??
      root.querySelector('title')?.text ??
      '',
  )

  const scope: HTMLElement = root.querySelector('article') ?? root.querySelector('body') ?? root
  const seen = new Set<string>()
  const paragraphs: string[] = []
  for (const p of scope.querySelectorAll('p')) {
    const text = cleanText(p.text)
    const hanCount = Array.from(text).filter((c) => HAN.test(c)).length
    if (hanCount < MIN_HAN_CHARS || seen.has(text)) continue
    seen.add(text)
    paragraphs.push(text)
  }
  return { title, paragraphs }
}
