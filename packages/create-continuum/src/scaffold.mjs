// Scaffolding core of create-continuum-js. Buildless plain ESM — the CLI
// ships sources, so there is no compile step and no dependencies.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "template",
);

// Same shape npm itself enforces for new package names.
const VALID_NAME = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

/**
 * Ask the npm registry for the latest published Continuum version so a fresh
 * scaffold always starts on it, however old the installed CLI is. Returns
 * `null` on any failure (offline, registry hiccup) — the caller then keeps
 * the template's baked ranges. `run` is injectable for tests.
 */
export function resolveLatestContinuum(
  run = (cmd, args) =>
    execFileSync(cmd, args, {
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
      shell: process.platform === "win32",
    }),
) {
  try {
    // frp/dom/std are released as a fixed version group; one lookup covers all.
    const out = String(run("npm", ["view", "@continuum-js/dom", "version"]));
    const version = out.trim();
    return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version) ? version : null;
  } catch {
    return null;
  }
}

/**
 * Copy the project template into `targetDir` and stamp `projectName` into its
 * package.json. Throws on an invalid name or a non-empty target directory.
 * `opts.continuumVersion`, when provided, replaces the baked `@continuum-js/*`
 * ranges with `^<version>` (see `resolveLatestContinuum`).
 */
export function scaffold(targetDir, projectName, opts = {}) {
  if (!VALID_NAME.test(projectName)) {
    throw new Error(
      `"${projectName}" is not a valid package name (lowercase letters, digits, ".", "-", "_").`,
    );
  }
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    throw new Error(`Target directory "${targetDir}" is not empty.`);
  }

  mkdirSync(targetDir, { recursive: true });
  cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

  // npm strips dotfiles when packing, so the template ships `_gitignore`.
  renameSync(join(targetDir, "_gitignore"), join(targetDir, ".gitignore"));

  const pkgPath = join(targetDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = projectName;
  if (opts.continuumVersion) {
    for (const dep of Object.keys(pkg.dependencies)) {
      if (dep.startsWith("@continuum-js/")) {
        pkg.dependencies[dep] = `^${opts.continuumVersion}`;
      }
    }
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
