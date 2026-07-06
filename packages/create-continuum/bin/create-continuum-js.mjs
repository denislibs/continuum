#!/usr/bin/env node
// create-continuum-js — scaffold a Continuum + Vite + TypeScript project.
//
//   npm create continuum-js@latest my-app
//   cd my-app && npm install && npm run dev

import { createInterface } from "node:readline/promises";
import { basename, resolve } from "node:path";
import { scaffold } from "../src/scaffold.mjs";

let name = process.argv[2];

if (!name) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  name = (await rl.question("Project name: ")).trim();
  rl.close();
}

if (!name) {
  console.error("✗ project name is required");
  process.exit(1);
}

const dir = resolve(process.cwd(), name);

try {
  scaffold(dir, basename(dir));
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

console.log(`
✓ Scaffolded ${basename(dir)}

Next steps:
  cd ${name}
  npm install
  npm run dev
`);
