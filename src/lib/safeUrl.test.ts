import { publicHttpUrl } from './safeUrl'

describe('publicHttpUrl', () => {
  it.each([
    'https://news.example.cn/a/123.html',
    'http://news.example.cn/a/123.html',
  ])('accepts %s', (url) => {
    expect(publicHttpUrl(url)?.href).toBe(url)
  })

  it.each([
    'ftp://news.example.cn/file',
    'file:///etc/passwd',
    'http://localhost:8080/',
    'http://127.0.0.1/',
    'http://10.1.2.3/',
    'http://192.168.0.5/',
    'http://172.20.0.1/',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]/',
    'http://printer.local/',
    'not a url',
  ])('rejects %s', (url) => {
    expect(publicHttpUrl(url)).toBeNull()
  })
})
