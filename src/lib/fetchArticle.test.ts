// @vitest-environment node
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/fetch-article.ts'

const fixture = readFileSync('src/test/fixtures/news-page.html')

function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      res.headers[name] = value
    },
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: unknown) {
      res.body = body
    },
  }
  return res
}

const query = (url?: string) => ({ query: { url } })

function stubFetch(body: BodyInit, init: { status?: number; type?: string; url?: string } = {}) {
  const response = new Response(body, {
    status: init.status ?? 200,
    headers: { 'content-type': init.type ?? 'text/html; charset=utf-8' },
  })
  Object.defineProperty(response, 'url', { value: init.url ?? 'https://news.example.cn/a/123.html' })
  vi.stubGlobal('fetch', vi.fn(async () => response))
}

afterEach(() => vi.unstubAllGlobals())

describe('fetch-article handler', () => {
  it('returns the title and paragraphs of a page', async () => {
    stubFetch(fixture)
    const res = fakeRes()
    await handler(query('https://news.example.cn/a/123.html') as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.headers['Cache-Control']).toBe('no-store')
    expect(res.body).toMatchObject({ url: 'https://news.example.cn/a/123.html' })
    expect((res.body as { paragraphs: string[] }).paragraphs).toHaveLength(3)
  })

  it('rejects a missing or private link before fetching anything', async () => {
    const res = fakeRes()
    await handler(query('http://127.0.0.1/admin') as never, res as never)
    expect(res.statusCode).toBe(400)
    await handler(query() as never, res as never)
    expect(res.statusCode).toBe(400)
  })

  it('refuses a redirect that lands on a private address', async () => {
    stubFetch(fixture, { url: 'http://169.254.169.254/latest' })
    const res = fakeRes()
    await handler(query('https://news.example.cn/a/123.html') as never, res as never)
    expect(res.statusCode).toBe(400)
  })

  it('refuses non-HTML responses', async () => {
    stubFetch('{}', { type: 'application/json' })
    const res = fakeRes()
    await handler(query('https://news.example.cn/api') as never, res as never)
    expect(res.statusCode).toBe(400)
  })

  it('says so when a page has no Chinese article text', async () => {
    stubFetch('<html><body><p>Hello world</p></body></html>')
    const res = fakeRes()
    await handler(query('https://news.example.cn/en') as never, res as never)
    expect(res.statusCode).toBe(422)
  })

  it('reports an upstream error status', async () => {
    stubFetch('nope', { status: 503 })
    const res = fakeRes()
    await handler(query('https://news.example.cn/down') as never, res as never)
    expect(res.statusCode).toBe(502)
    expect((res.body as { error: string }).error).toContain('503')
  })
})
