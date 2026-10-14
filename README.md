# HSK Reader

Paste a Chinese article, pick your HSK level, and read it with pinyin shown only above the words
you don't know yet. Long-press any word for its pinyin and meaning, and save it to an Anki deck.

Product requirements: see the PRD (Claude Doc "PRD: Chinese HSK Reader").

## Development

Requires Node 22 or later.

```sh
npm install
npm run dev        # start the dev server
npm test           # unit tests (Vitest)
npm run lint       # oxlint
npm run typecheck  # TypeScript
npm run build      # production build into dist/
```

## How we work

- `main` only changes through pull requests. Branch from `main` as `feat/…`, `fix/…` or `chore/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- CI (lint, type check, tests, build) must be green before a PR is squash-merged.
- Decisions that shape the app are recorded in [`docs/decisions`](docs/decisions).
