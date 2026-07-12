import { describe, test, expect } from "vitest";
import { buildRunnerHtml } from "./runner";

const MAP = { "@continuum-js/frp": "/continuum/playground/vendor/frp.js" };

describe("buildRunnerHtml", () => {
  test("embeds the import map so bare specifiers resolve in the iframe", () => {
    const html = buildRunnerHtml(MAP);
    expect(html).toContain('type="importmap"');
    expect(html).toContain("@continuum-js/frp");
    expect(html).toContain("/continuum/playground/vendor/frp.js");
  });

  test("provides the #app mount point", () => {
    expect(buildRunnerHtml(MAP)).toContain('id="app"');
  });

  test("import map appears before the harness module (maps must load first)", () => {
    const html = buildRunnerHtml(MAP);
    expect(html.indexOf('type="importmap"')).toBeLessThan(
      html.indexOf('type="module"'),
    );
  });

  test("listens for postMessage to run code", () => {
    const html = buildRunnerHtml(MAP);
    expect(html).toContain("addEventListener");
    expect(html).toContain("message");
  });
});
