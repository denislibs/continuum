# Continuum monorepo — guide for AI assistants

This is the **framework monorepo** (npm workspaces). If you are building an
_app with_ Continuum rather than working _on_ it, read the usage rules
instead: `packages/create-continuum/template/AGENTS.md` (the scaffold ships
that file) or https://denislibs.github.io/continuum/llms.txt

## Layout

- `packages/frp` — the FRP core: Behavior, Event, transactions. No DOM.
- `packages/dom` — JSX renderer, ownership tree, `Show`/`Each`/`Dynamic`,
  context, `onMount`/`onCleanup`.
- `packages/std` — event/behavior utilities (`debounce`, `resource`, …).
- `packages/router`, `packages/test`, `packages/create-continuum` (CLI +
  `template/` scaffold).
- `examples/*` — small apps; they alias packages to local sources when run
  inside the repo and use published packages when opened standalone.
- `docs/` — VitePress site, two mirrored locales (root = en, `/ru/`).
  `docs/reference/` is **generated** (`npm run docs:api`) — never hand-edit.

## Commands

```bash
npm test          # vitest, whole repo
npm run typecheck # tsc -b (emits to .tsout, not dist)
npm run lint      # eslint 9 flat config; prettier does formatting
npm run build     # per-package tsc -> dist (order matters, script handles it)
npm run size      # size-limit — budgets are HARD, CI-enforced
npm run smoke     # publish contract: pack -> clean app -> build (slow)
npm run docs:build / docs:api
```

## Rules

- **TDD, no exceptions**: failing test first (red), minimal code (green).
  Bug fixes start with a reproducing test.
- **Size budgets are hard** (`.size-limit.json`). New dom/frp code must fit;
  check `npm run size` before pushing.
- Internal package imports use explicit `.js` extensions (Node ESM). JSX
  compiler options live only in the rendering packages' tsconfigs — never in
  `tsconfig.base.json`.
- No `prepack` scripts in packages — `changeset publish` packs concurrently
  and a `rm -rf dist` there races sibling type resolution.
- Performance benchmarks run locally only — never add them to CI.
- Versioning/publishing is changesets-driven: add a `.changeset/*.md` for
  any user-visible package change; the release PR is generated.
- Both docs locales must stay mirrored: any en page edit needs the ru twin
  (and vice versa). The sidebar is generated from one tree in
  `docs/.vitepress/config.mts`.
- Node floor is 20.9: no `import.meta.dirname`, and dev-tool versions are
  pinned accordingly (eslint ^9, lint-staged ^15, human-id 3.0.1).
