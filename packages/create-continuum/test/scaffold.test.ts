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
import { scaffold, resolveLatestContinuum } from "../src/scaffold.mjs";

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

  test("stamps a resolved continuum version onto the runtime deps", () => {
    const dir = join(work, "app");
    scaffold(dir, "app", { continuumVersion: "9.9.9" });
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(pkg.dependencies["@continuum-js/dom"]).toBe("^9.9.9");
    expect(pkg.dependencies["@continuum-js/frp"]).toBe("^9.9.9");
    // tooling deps are not touched by the stamp
    expect(pkg.devDependencies.vite).toMatch(/^\^/);
  });

  test("without a resolved version the template's baked ranges stay", () => {
    const dir = join(work, "app");
    scaffold(dir, "app");
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    // vitest runs from the repo root; import.meta.url is virtual here.
    const template = JSON.parse(
      readFileSync(
        join(process.cwd(), "packages/create-continuum/template/package.json"),
        "utf8",
      ),
    );
    expect(pkg.dependencies).toEqual(template.dependencies);
  });
});

describe("resolveLatestContinuum", () => {
  test("returns the version reported by the registry lookup", () => {
    expect(resolveLatestContinuum(() => "0.9.9\n")).toBe("0.9.9");
  });

  test("returns null when the lookup fails (offline scaffolding stays possible)", () => {
    expect(
      resolveLatestContinuum(() => {
        throw new Error("ENOTFOUND");
      }),
    ).toBeNull();
  });

  test("returns null on garbage output instead of stamping it", () => {
    expect(resolveLatestContinuum(() => "npm WARN something")).toBeNull();
  });
});
