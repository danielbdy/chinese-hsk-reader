// Kept apart from exportDeck.ts so the component can call these without loading sql.js.

export function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Opens the phone's share sheet with the file (pick AnkiDroid there).
 * Returns false if the browser cannot share files. navigator.share needs a tap in the same
 * moment, so call this before any await in the click handler; a prebuilt File keeps that possible.
 */
export async function share(file: File): Promise<boolean> {
  if (!navigator.canShare?.({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title: 'HSK Reader deck' })
  } catch (error) {
    // The person closed the share sheet: nothing to do.
    if (error instanceof DOMException && error.name === 'AbortError') return true
    throw error
  }
  return true
}
