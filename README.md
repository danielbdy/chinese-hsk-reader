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
npm run test:e2e   # Playwright tests on a phone viewport (builds first: npm run build)
```

`npm run dev` and `npm run build` first run `npm run data`, which builds the dictionary into
`public/data/`. Word data sources and licences are listed in [`data/README.md`](data/README.md).

Reading from a link uses the serverless function in `api/`. `npm run dev` serves only the front end,
so use `npx vercel dev` to try link import locally. The tests stub the function. See
[decision 0003](docs/decisions/0003-server-side-article-fetch.md) for why it exists and its limits.

To check an Anki export with Anki's own importer:

```sh
pip install anki
node scripts/sample-apkg.ts sample.apkg
python scripts/verify-apkg.py sample.apkg
```

## How we work

- `main` only changes through pull requests. Branch from `main` as `feat/…`, `fix/…` or `chore/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- CI (lint, type check, tests, build) must be green before a PR is squash-merged.
- Decisions that shape the app are recorded in [`docs/decisions`](docs/decisions).
