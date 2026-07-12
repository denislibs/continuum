#!/usr/bin/env node
// Copies the built @continuum-js ESM bundles into docs/public so the
// playground iframe can load the REAL framework (same version as the docs)
// through an import map — no CDN, no version drift.
//
// Each package's whole dist/ is mirrored under vendor/<pkg>/ so the bundles'
// own relative imports (e.g. dom/jsx-runtime.js does `import "./index.js"`)
// keep resolving. Cross-package imports use bare specifiers, resolved by the
// import map written here as importmap.json.
//
//   node scripts/build-playground-vendor.mjs
//
// Run after `npm run build`. Wired into docs:build / docs:dev.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "docs", "public", "playground", "vendor");

// The site is served under /continuum/ (config base). public/ maps to that
// base, so a vendor file's runtime URL is /continuum/playground/vendor/<pkg>/…
const BASE = "/continuum/playground/vendor/";

// package dir -> the subpath specifiers it exposes (specifier suffix -> file)
const PACKAGES = [
  {
    pkg: "frp",
    dir: "packages/frp/dist",
    subpaths: { "": "index.js", "/continuous": "continuous.js" },
  },
  {
    pkg: "dom",
    dir: "packages/dom/dist",
    subpaths: {
      "": "index.js",
      "/jsx-runtime": "jsx-runtime.js",
      "/jsx-dev-runtime": "jsx-dev-runtime.js",
      "/compiled": "compiled.js",
      "/events": "events.js",
    },
  },
  { pkg: "std", dir: "packages/std/dist", subpaths: { "": "index.js" } },
  { pkg: "router", dir: "packages/router/dist", subpaths: { "": "index.js" } },
  { pkg: "test", dir: "packages/test/dist", subpaths: { "": "index.js" } },
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const imports = {};
// Type manifest: virtual node_modules path -> fetch url. Monaco loads these
// .d.ts into its TypeScript worker so the editor gets real @continuum-js types.
const types = [];
const missing = [];
for (const { pkg, dir, subpaths } of PACKAGES) {
  const absDir = path.join(root, dir);
  if (!fs.existsSync(absDir)) {
    missing.push(dir);
    continue;
  }
  // Copy the whole dist/: .js for the iframe runtime, .d.ts for Monaco types.
  const dest = path.join(outDir, pkg);
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(absDir)) {
    if (file.endsWith(".js") || file.endsWith(".d.ts")) {
      fs.copyFileSync(path.join(absDir, file), path.join(dest, file));
    }
    if (file.endsWith(".d.ts")) {
      types.push({
        path: `node_modules/@continuum-js/${pkg}/${file}`,
        url: `${BASE}${pkg}/${file}`,
      });
    }
  }
  // A package.json shim so `import "@continuum-js/pkg"` resolves to index.d.ts.
  types.push({
    path: `node_modules/@continuum-js/${pkg}/package.json`,
    content: JSON.stringify({
      name: `@continuum-js/${pkg}`,
      types: "index.d.ts",
    }),
  });
  for (const [suffix, file] of Object.entries(subpaths)) {
    imports[`@continuum-js/${pkg}${suffix}`] = `${BASE}${pkg}/${file}`;
  }
}

if (missing.length) {
  console.error(
    `\n✗ missing dist bundles — run \`npm run build\` first:\n  ${missing.join("\n  ")}\n`,
  );
  process.exit(1);
}

fs.writeFileSync(
  path.join(outDir, "importmap.json"),
  JSON.stringify({ imports }, null, 2) + "\n",
);

fs.writeFileSync(
  path.join(outDir, "types.json"),
  JSON.stringify({ types }, null, 2) + "\n",
);

console.log(
  `✓ playground vendor: ${PACKAGES.length} packages → ${path.relative(root, outDir)}`,
);
