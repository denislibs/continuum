---
"@continuum/frp": minor
"@continuum/dom": minor
"@continuum/std": minor
---

First installable release: packages now ship compiled ESM + `.d.ts` in `dist/`
with proper `exports` maps (`@continuum/dom` also exposes `jsx-runtime` /
`jsx-dev-runtime` subpaths). A clean Vite + TypeScript project can
`npm i @continuum/dom` and build without any monorepo tooling.
