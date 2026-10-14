// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { errorMessage } from './readResponse'

describe('errorMessage', () => {
  it('uses the message from a JSON error', async () => {
    const res = new Response(JSON.stringify({ error: 'No Chinese article text found.' }), { status: 422 })
    expect(await errorMessage(res)).toBe('No Chinese article text found.')
  })

  it('does not show a platform error page to the reader', async () => {
    const res = new Response('A server error has occurred', { status: 500 })
    expect(await errorMessage(res)).toBe('The server could not read that page (error 500). Paste the text instead.')
  })
})
