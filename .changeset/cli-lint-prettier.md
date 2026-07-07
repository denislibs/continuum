---
"create-continuum-js": minor
---

Scaffolded apps now ship with linting and formatting out of the box: ESLint
(flat config — js + typescript-eslint recommended, `eslint-config-prettier`
last) wired to `@continuum-js/eslint-plugin`'s recommended preset, prettier
with default settings, and `npm run lint` / `npm run format` scripts. The
smoke e2e packs the plugin tarball and lints the generated app.
