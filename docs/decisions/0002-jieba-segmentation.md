# 0002: jieba for word segmentation, pinyin-pro for pinyin

Date: 2026-10-14. Status: accepted.

## Decision

- **Segmentation:** jieba, compiled to WebAssembly (`jieba-wasm`), with its HMM model on for unseen words.
- **Pinyin:** `pinyin-pro`, run over the whole paragraph so characters with several readings
  (银行 yín háng vs 行走 xíng zǒu, 重要 vs 重新) get the reading that fits the context.
- **Meanings:** CC-CEDICT. When jieba produces a word CC-CEDICT doesn't have (铁路局, 购票, 新能源),
  the word stays whole on the page and the popup explains its pieces (铁路 + 局).

## Evidence

Measured on `src/test/fixtures/news-sample.txt` (10 hand-segmented news-style sentences, 140 words):

| Segmenter | Precision | Recall | F1 |
| --- | --- | --- | --- |
| jieba-wasm 2.4.0 | 97.1% | 96.4% | 96.7% |
| Intl.Segmenter (Node 22 ICU) | 85.0% | 90.6% | 87.7% |

Intl.Segmenter split names (习|近平), common words (购|票, 车|次) and produced wrong boundaries
such as 人|均可|支配. jieba's remaining misses are borderline (年前, 可|支配).

All 113 Chinese words in the sample get a meaning, 109 of them as whole words.

## Cost

The jieba WebAssembly file adds about 4 MB (it includes jieba's dictionary), and the CC-CEDICT
JSON is about 9.6 MB (3.6 MB gzipped). Both load once and are cached by the browser.
The accuracy test runs in CI so a library upgrade that hurts segmentation fails the build.

## Revisit when

The real news article trial (M6) shows segmentation errors that matter to the reader, or load
time on a phone is too slow.
