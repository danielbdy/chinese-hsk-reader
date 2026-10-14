/** Splits a run of text into words. */
export type CutFn = (text: string) => string[]

let jieba: Promise<CutFn> | undefined

/**
 * Loads jieba (WebAssembly) once and returns its word cutter.
 * jieba scored F1 96.7 against 87.7 for Intl.Segmenter on our news sample; see docs/decisions/0002.
 */
export function loadJieba(): Promise<CutFn> {
  jieba ??= import('jieba-wasm').then(async (mod) => {
    await mod.default()
    return (text: string) => mod.cut(text, true)
  })
  return jieba
}
