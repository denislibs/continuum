import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error — plain-JS module without type declarations (buildless CLI)
import { scaffold } from "../src/scaffold.mjs";

let work: string;
beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "create-continuum-test-"));
});
afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("scaffold", () => {
  test("creates a project with the given name", () => {
    const dir = join(work, "my-app");
    scaffold(dir, "my-app");

    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(pkg.name).toBe("my-app");
    expect(pkg.dependencies["@continuum-js/dom"]).toBeDefined();
    expect(pkg.dependencies["@continuum-js/frp"]).toBeDefined();

    // key template files land in place
    expect(existsSync(join(dir, "index.html"))).toBe(true);
    expect(existsSync(join(dir, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(dir, "src", "main.tsx"))).toBe(true);
    expect(existsSync(join(dir, "src", "App.tsx"))).toBe(true);
    expect(existsSync(join(dir, "src", "App.test.tsx"))).toBe(true);
  });

  test("renames _gitignore to .gitignore (npm strips dotfiles from tarballs)", () => {
    const dir = join(work, "app");
    scaffold(dir, "app");
    expect(existsSync(join(dir, ".gitignore"))).toBe(true);
    expect(existsSync(join(dir, "_gitignore"))).toBe(false);
  });

  test("jsx is wired to the automatic runtime", () => {
    const dir = join(work, "app");
    scaffold(dir, "app");
    const ts = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
    expect(ts.compilerOptions.jsx).toBe("react-jsx");
    expect(ts.compilerOptions.jsxImportSource).toBe("@continuum-js/dom");
  });

  test("refuses a non-empty target directory", () => {
    const dir = join(work, "busy");
    mkdirSync(dir);
    writeFileSync(join(dir, "keep.txt"), "");
    expect(() => scaffold(dir, "busy")).toThrow(/not empty/i);
  });

  test("refuses an invalid npm package name", () => {
    expect(() => scaffold(join(work, "x"), "Bad Name!")).toThrow(/name/i);
  });
});
