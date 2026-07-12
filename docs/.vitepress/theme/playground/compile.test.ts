import { describe, test, expect } from "vitest";
import { compileToTemplates } from "./compile";

describe("compileToTemplates", () => {
  test("lifts static markup into a parse-once template", () => {
    const out = compileToTemplates(
      `export default () => <div class="x">hi {1 + 1}</div>;`,
    );
    expect(out.error).toBeNull();
    // static html glued into one string, parsed once by the compiled runtime
    expect(out.code).toContain("@continuum-js/dom/compiled");
    expect(out.code).toContain("_$tmpl");
    expect(out.code).toContain('<div class=\\"x\\">hi </div>');
  });

  test("turns dynamic children into insert holes, not re-renders", () => {
    const out = compileToTemplates(`export default () => <p>{1 + 1}</p>;`);
    expect(out.error).toBeNull();
    expect(out.code).toContain("_$insert");
  });

  test("reports errors instead of throwing", () => {
    const out = compileToTemplates(`const = ;`);
    expect(out.code).toBeNull();
    expect(out.error).toBeTruthy();
  });
});
