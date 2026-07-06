---
"@continuum-js/frp": minor
"@continuum-js/dom": minor
"@continuum-js/std": minor
---

First installable release: packages now ship compiled ESM + `.d.ts` in `dist/`
with proper `exports` maps (`@continuum-js/dom` also exposes `jsx-runtime` /
`jsx-dev-runtime` subpaths). A clean Vite + TypeScript project can
`npm i @continuum-js/dom` and build without any monorepo tooling.
