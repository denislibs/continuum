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
 * Copy the project template into `targetDir` and stamp `projectName` into its
 * package.json. Throws on an invalid name or a non-empty target directory.
 */
export function scaffold(targetDir, projectName) {
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
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
