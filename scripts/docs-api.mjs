// Generate the API reference (docs/reference/<pkg>) from JSDoc via typedoc.
// Committed output — regenerate with `npm run docs:api` after API changes.
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

const PACKAGES = [
  ["frp", "packages/frp/src/index.ts"],
  ["std", "packages/std/src/index.ts"],
  ["dom", "packages/dom/src/index.tsx"],
  ["router", "packages/router/src/index.ts"],
  ["test", "packages/test/src/index.ts"],
];

for (const [name, entry] of PACKAGES) {
  rmSync(`docs/reference/${name}`, { recursive: true, force: true });
  execFileSync(
    "npx",
    [
      "typedoc",
      "--tsconfig",
      `packages/${name}/tsconfig.json`,
      "--plugin",
      "typedoc-plugin-markdown",
      "--out",
      `docs/reference/${name}`,
      "--entryFileName",
      "index",
      "--readme",
      "none",
      entry,
    ],
    { stdio: "inherit" },
  );
  console.log(`✓ ${name}`);
}
