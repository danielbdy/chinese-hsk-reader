import { readFileSync } from 'node:fs'
import { decodeHtml, extractArticle } from './extract'

const fixture = readFileSync('src/test/fixtures/news-page.html', 'utf8')

describe('extractArticle', () => {
  it('takes the title from og:title', () => {
    expect(extractArticle(fixture).title).toBe('涉及CR450系列化产品、12306升级 未来五年铁路出行将有这些新变化')
  })

  it('keeps Chinese body paragraphs and drops navigation, captions and duplicates', () => {
    const { paragraphs } = extractArticle(fixture)
    expect(paragraphs).toEqual([
      '国家铁路局近日发布了铁路科技创新规划，提出到2030年基本建成引领铁路现代化的科技创新体系。',
      '在装备方面，将研制适应时速400公里商业运营的CR450高速列车，同时推进新能源机车。',
      '旅客可以在手机上查询车次、预订车票和办理改签，12306平台将升级为全行程智能服务。',
    ])
  })

  it('does not return the page chrome', () => {
    expect(extractArticle(fixture).paragraphs.join('')).not.toContain('首页')
  })
})

describe('decodeHtml', () => {
  it('uses the charset from the header', () => {
    const bytes = new TextEncoder().encode('<p>中文</p>')
    expect(decodeHtml(bytes, 'text/html; charset=utf-8')).toBe('<p>中文</p>')
  })

  it('reads GBK pages declared in a meta tag', () => {
    const gbk = Uint8Array.from([0x3c, 0x6d, 0x65, 0x74, 0x61, 0x20, 0x63, 0x68, 0x61, 0x72, 0x73, 0x65, 0x74, 0x3d, 0x67, 0x62, 0x6b, 0x3e, 0xd6, 0xd0, 0xce, 0xc4, 0x3c, 0x2f, 0x70, 0x3e])
    expect(decodeHtml(gbk, null)).toContain('中文')
  })
})
