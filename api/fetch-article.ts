import { extractArticle, decodeHtml } from '../src/lib/extract.js'
import { publicHttpUrl } from '../src/lib/safeUrl.js'

// Vercel serverless function: fetches one news page and returns its title and paragraphs.
// Browsers can't read other sites directly (CORS), so the fetch happens here.

const TIMEOUT_MS = 6000
const MAX_BYTES = 2 * 1024 * 1024

interface Request {
  url?: string
  query: Record<string, string | string[] | undefined>
}

interface Response {
  status(code: number): Response
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

function json(res: Response, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(body)
}

async function readLimited(res: globalThis.Response): Promise<Uint8Array> {
  const reader = res.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new Error('page is too large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export default async function handler(req: Request, res: Response) {
  try {
    await fetchArticle(req, res)
  } catch (error) {
    // Every failure must answer with JSON; the app can't read a platform error page.
    console.error('fetch-article failed', error)
    json(res, 500, { error: 'The server could not read that page. Paste the text instead.' })
  }
}

async function fetchArticle(req: Request, res: Response) {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  const url = raw ? publicHttpUrl(raw) : null
  if (!url) return json(res, 400, { error: 'Enter a full http or https link to a news page.' })

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HSK-Reader/0.1; personal reading tool)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    // A redirect may land on a private address; check where we ended up too.
    if (!publicHttpUrl(upstream.url)) return json(res, 400, { error: 'That link redirects somewhere we cannot read.' })
    if (!upstream.ok) return json(res, 502, { error: `The site answered ${upstream.status}.` })
    const type = upstream.headers.get('content-type') ?? ''
    if (!type.includes('html')) return json(res, 400, { error: 'That link is not a web page.' })

    const html = decodeHtml(await readLimited(upstream), type)
    const article = extractArticle(html)
    if (article.paragraphs.length === 0) {
      return json(res, 422, { error: 'No Chinese article text found on that page. Paste the text instead.' })
    }
    return json(res, 200, { url: upstream.url, ...article })
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return json(res, 502, {
      error: timedOut ? 'The site took too long to answer.' : 'Could not fetch that page. Paste the text instead.',
    })
  }
}
