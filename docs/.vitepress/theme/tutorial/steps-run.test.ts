import { describe, test, expect, afterEach, afterAll } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as t from "@continuum-js/test";
import type { CheckCtx } from "./types";
import { tracks } from "./tracks";

// Behavioral verification for every tutorial track: each solution passes its
// check and each starter fails it — run against the REAL bundles through
// vite's own transform, the same jsx-runtime the site uses. Each code snippet
// is written to a temp .tsx and imported so vite applies the automatic JSX
// transform + @continuum-js aliases; the check then runs it in jsdom with the
// actual @continuum-js/test utilities. (The prod playground uses babel in an
// iframe; this is the node-side equivalent that the CI can gate on.)

const tmpDir = resolve(
  process.cwd(),
  "docs/.vitepress/theme/tutorial/__verify__",
);
mkdirSync(tmpDir, { recursive: true });
let counter = 0;

async function loadApp(code: string): Promise<() => unknown> {
  const file = resolve(tmpDir, `app-${counter++}.tsx`);
  // Pin the JSX runtime per-file: this vite build uses oxc, which ignores the
  // config's esbuild jsxImportSource and would otherwise default to "react".
  writeFileSync(file, `/** @jsxImportSource @continuum-js/dom */\n${code}`);
  const mod = await import(/* @vite-ignore */ pathToFileURL(file).href);
  return mod.default as () => unknown;
}

function ctxFor(App: () => unknown): CheckCtx {
  return {
    App: App as CheckCtx["App"],
    render: t.render as unknown as CheckCtx["render"],
    click: t.click,
    type: t.type,
    fire: t.fire,
    flush: t.flush,
    cleanup: t.cleanup,
  };
}

// A check that throws counts as a failure — same as the production iframe
// runner, which reports pass:false when a check errors out.
async function runCheck(
  code: string,
  check: (ctx: CheckCtx) => boolean | Promise<boolean>,
): Promise<boolean> {
  try {
    const App = await loadApp(code);
    return !!(await check(ctxFor(App)));
  } catch {
    return false;
  }
}

afterEach(() => t.cleanup());
afterAll(() => rmSync(tmpDir, { recursive: true, force: true }));

for (const track of tracks) {
  describe(`${track.id} track`, () => {
    for (const step of track.steps) {
      test(`${step.id}: solution passes its check`, async () => {
        expect(await runCheck(step.solution, step.check)).toBe(true);
      });

      test(`${step.id}: starter fails its check`, async () => {
        expect(await runCheck(step.starter, step.check)).toBe(false);
      });
    }
  });
}
