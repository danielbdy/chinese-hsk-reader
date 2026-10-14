import { useEffect, useState } from 'react'

const PREFIX = 'hsk-reader:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** useState that survives reloads, stored as JSON in localStorage under "hsk-reader:<key>". */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Storage full or blocked (private browsing): keep working in memory.
    }
  }, [key, value])
  return [value, setValue] as const
}
