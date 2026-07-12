// Smoke test for the publish contract (ROADMAP v0.3).
//
// Simulates a real consumer: packs the workspace packages into tarballs,
// installs them into a throwaway Vite + TS project OUTSIDE the monorepo
// (no aliases, no tsconfig paths — only what ships in the tarball), then:
//   1. `tsc --noEmit`  — types resolve through `exports` maps;
//   2. `vite build`    — bundler resolution + the code actually bundles;
//   3. `node` import   — dist is valid ESM for Node (extension-full imports).
//
// Run from the repo root: `npm run smoke`.

import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = [
  "frp",
  "dom",
  "std",
  "test",
  "router",
  "eslint-plugin",
  "vite-plugin",
];

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

function runOut(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: "utf8" });
}

function fail(msg) {
  console.error(`\n✗ smoke: ${msg}`);
  process.exit(1);
}

// ─── 1. Build and pack every publishable package ───────────────────────────

const work = mkdtempSync(join(tmpdir(), "continuum-smoke-"));
process.on("exit", () => rmSync(work, { recursive: true, force: true }));
const tarballDir = join(work, "tarballs");
mkdirSync(tarballDir);

run("npm", ["run", "build"], root);

for (const p of PACKAGES) {
  run(
    "npm",
    ["pack", "-w", `@continuum-js/${p}`, "--pack-destination", tarballDir],
    root,
  );
}

const tarballs = Object.fromEntries(
  PACKAGES.map((p) => {
    const file = readdirSync(tarballDir).find((f) =>
      f.startsWith(`continuum-js-${p}-`),
    );
    if (!file) fail(`no tarball produced for @continuum-js/${p}`);
    return [p, join(tarballDir, file)];
  }),
);

// Tarballs must ship dist, not raw TypeScript sources.
for (const p of PACKAGES) {
  const listing = runOut("tar", ["-tzf", tarballs[p]]);
  if (!listing.includes("package/dist/index.js"))
    fail(`@continuum-js/${p} tarball has no dist/index.js`);
  if (!listing.includes("package/dist/index.d.ts"))
    fail(`@continuum-js/${p} tarball has no dist/index.d.ts`);
}

// ─── 2. Scaffold a consumer project (what create-continuum will generate) ──

const app = join(work, "app");
mkdirSync(join(app, "src"), { recursive: true });

writeFileSync(
  join(app, "package.json"),
  JSON.stringify(
    {
      name: "smoke-app",
      private: true,
      type: "module",
      dependencies: {
        "@continuum-js/frp": `file:${tarballs.frp}`,
        "@continuum-js/dom": `file:${tarballs.dom}`,
        "@continuum-js/std": `file:${tarballs.std}`,
      },
      devDependencies: { typescript: "~5.5.0", vite: "^5.4.0" },
    },
    null,
    2,
  ),
);

writeFileSync(
  join(app, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "es2020",
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        lib: ["es2020", "dom"],
        jsx: "react-jsx",
        jsxImportSource: "@continuum-js/dom",
      },
      include: ["src"],
    },
    null,
    2,
  ),
);

writeFileSync(
  join(app, "index.html"),
  `<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
);

// Hello-world touching all three packages + automatic JSX runtime.
writeFileSync(
  join(app, "src", "main.tsx"),
  `import { state, type State } from "@continuum-js/frp";
import { mount } from "@continuum-js/dom";
import { count } from "@continuum-js/std";

const n = state(0);
const setN = n.set;
const label: State<string> = n.map((v: number) => \`clicks: \${v}\`);

function App() {
  return (
    <div>
      <h1>{label}</h1>
      <button onClick={() => setN(n.sample() + 1)}>+1</button>
    </div>
  );
}

mount(document.getElementById("app")!, () => <App />);
// keep std import alive so its resolution is actually exercised
void count;
`,
);

// ─── 3. Install and verify ─────────────────────────────────────────────────

run("npm", ["install", "--no-audit", "--no-fund"], app);
run("npx", ["tsc", "--noEmit"], app);
run("npx", ["vite", "build", "--logLevel", "warn"], app);

// dist must be importable by plain Node ESM (extension-full relative imports).
const nodeCheck = (pkg, name) =>
  run(
    "node",
    [
      "-e",
      `import('${pkg}').then(m => { if (typeof m.${name} !== 'function') { console.error('bad ${pkg} export'); process.exit(1); } })`,
    ],
    app,
  );
nodeCheck("@continuum-js/frp", "state");
nodeCheck("@continuum-js/std", "debounce");

// ─── 4. create-continuum-js e2e ────────────────────────────────────────────
// Scaffold a project with the real CLI, point its deps at the local tarballs
// (hermetic — no registry), then install, type-check, build and run its test.

const cliApp = join(work, "cli-app");
run(
  "node",
  [
    join(
      root,
      "packages",
      "create-continuum",
      "bin",
      "create-continuum-js.mjs",
    ),
    "cli-app",
  ],
  work,
);

const cliPkgPath = join(cliApp, "package.json");
const cliPkg = JSON.parse(readFileSync(cliPkgPath, "utf8"));
cliPkg.dependencies["@continuum-js/frp"] = `file:${tarballs.frp}`;
cliPkg.dependencies["@continuum-js/dom"] = `file:${tarballs.dom}`;
cliPkg.devDependencies["@continuum-js/eslint-plugin"] =
  `file:${tarballs["eslint-plugin"]}`;
cliPkg.devDependencies["@continuum-js/vite-plugin"] =
  `file:${tarballs["vite-plugin"]}`;
writeFileSync(cliPkgPath, JSON.stringify(cliPkg, null, 2));

run("npm", ["install", "--no-audit", "--no-fund"], cliApp);
run("npm", ["run", "build"], cliApp); // tsc --noEmit && vite build
run("npm", ["test"], cliApp); // the scaffolded counter test
run("npm", ["run", "lint"], cliApp); // eslint flat config + continuum plugin

console.log(
  "\n✓ smoke: tarballs install and build; scaffolded app builds and its test passes",
);
