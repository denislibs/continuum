import { describe, test, expect } from "vitest";
import { transpile } from "./transpile";

describe("transpile", () => {
  test("strips TypeScript types", () => {
    const out = transpile(`const n: number = 1; export {}`);
    expect(out.error).toBeNull();
    expect(out.code).toContain("const n = 1");
    expect(out.code).not.toContain(": number");
  });

  test("compiles JSX through the automatic @continuum-js/dom runtime", () => {
    const out = transpile(`export const app = <div class="x">hi</div>;`);
    expect(out.error).toBeNull();
    // automatic runtime imports the jsx factory from our dom package
    expect(out.code).toContain("@continuum-js/dom/jsx-runtime");
    expect(out.code).toMatch(/jsx/);
  });

  test("reports syntax errors instead of throwing", () => {
    const out = transpile(`const = ;`);
    expect(out.code).toBeNull();
    expect(out.error).toBeTruthy();
    expect(typeof out.error).toBe("string");
  });

  test("leaves bare @continuum-js imports intact for the import map", () => {
    const out = transpile(
      `import { state } from "@continuum-js/frp"; export const s = state(0);`,
    );
    expect(out.error).toBeNull();
    expect(out.code).toContain(`"@continuum-js/frp"`);
  });
});
