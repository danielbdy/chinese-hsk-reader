# 0003: One server function fetches article links

Date: 2026-10-14. Status: accepted. Amends [0001](0001-static-web-app.md).

## Decision

The app stays a static site, with one exception: `api/fetch-article.ts`, a Vercel serverless
function. It fetches a single news page for the reader, extracts the title and the body
paragraphs, and returns them as JSON. Everything else still runs in the browser.

## Why

Browsers can't read other sites' pages directly (CORS), and news sites don't allow it. Pasting the
whole article works everywhere, but a link saves the step.

## Guardrails

- Only `http` and `https` links. Localhost, private IPv4 addresses and IPv6 literals are refused,
  both in the link and after any redirect. This stops the function being used to reach the
  server's own network.
- 8 second timeout and a 2 MB limit on the page.
- Charset comes from the HTTP header or the page's `<meta>` tag, so GBK pages decode correctly.
- The function sends a descriptive User-Agent and fetches only when a person submits a link.
- Only the sentence around a word you save is kept, in the browser's storage. The full article is
  not stored on the server.

## Open risks

- **No rate limit.** Anyone who finds the URL can make it fetch pages. Fine for a personal tool;
  add a limit before sharing the URL widely.
- **DNS rebinding** is not checked. A hostname that resolves to a private address after our check
  would get through. Low risk for a personal tool; a fix would resolve the hostname first.
- **Copyright and site terms.** The app reads one page on request for personal reading, and keeps
  only the words saved. Check the terms of any site before using the link feature with it.
- **Paywalled and script-rendered pages** return little or no text. The app says so and offers
  paste instead.

## Revisit when

Sharing the app with other people, or when a source needs a login.
