const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
]

/**
 * Returns the URL if it is a public http(s) address, or null. Blocks obvious internal targets
 * (localhost, private IPv4 and IPv6 literals) so the fetch endpoint can't reach the server's own network.
 */
export function publicHttpUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return null
  if (host.includes(':')) return null // IPv6 literal: none of our sources use one
  if (PRIVATE_IPV4.some((re) => re.test(host))) return null
  return url
}
