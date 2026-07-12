import { describe, test, expect } from "vitest";
import { encodeCode, decodeCode } from "./share";

describe("share", () => {
  test("round-trips code through the URL-safe encoding", () => {
    const src = `import { state } from "@continuum-js/frp";\nconst s = state(0);`;
    expect(decodeCode(encodeCode(src))).toBe(src);
  });

  test("round-trips unicode and JSX", () => {
    const src = `export default () => <div>Привет 👋 {1 + 1}</div>;`;
    expect(decodeCode(encodeCode(src))).toBe(src);
  });

  test("produces URL-safe output (no chars needing escaping)", () => {
    const enc = encodeCode("const x = <a href='?a=b&c'/>");
    expect(enc).toBe(encodeURIComponent(enc));
  });

  test("returns null for malformed input instead of throwing", () => {
    expect(decodeCode("!!!not-valid!!!")).toBeNull();
  });
});
