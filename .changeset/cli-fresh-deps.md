---
"create-continuum-js": minor
---

Fresh scaffolds, always current. The CLI now asks the npm registry for the
latest published Continuum version and stamps it into the generated
package.json (offline it falls back to the template's baked ranges), so an
old CLI build no longer pins new projects to old libraries. The template
toolchain is updated to Vite 8, TypeScript 6, Vitest 4 and jsdom 29, with an
`engines` field matching Vite 8's Node requirement (20.19+ / 22.12+).
