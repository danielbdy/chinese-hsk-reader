/** A failed request as the app shows it: the server's own message when it sent one, else a plain reason. */
export async function errorMessage(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const body = JSON.parse(text) as { error?: string }
    if (body.error) return body.error
  } catch {
    // Not JSON: a platform error page. Don't show its text to the reader.
  }
  return `The server could not read that page (error ${res.status}). Paste the text instead.`
}
