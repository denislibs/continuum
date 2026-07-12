// The transform, tested at the source level: what compiles, what bails.
import { describe, test, expect } from "vitest";
import { transformSync } from "@babel/core";
import jsxSyntax from "@babel/plugin-syntax-jsx";
import tsSyntax from "@babel/plugin-syntax-typescript";
import { continuumJsx } from "../src/transform.js";

function compile(code: string): string {
  const res = transformSync(code, {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx", "typescript"] },
    plugins: [[tsSyntax, { isTSX: true }], jsxSyntax, continuumJsx],
    code: true,
  });
  return res!.code!;
}

describe("continuum jsx transform", () => {
  test("a static tree becomes ONE template with no holes", () => {
    const out = compile(`const v = <div class="a"><span>hi</span></div>;`);
    expect(out).toContain(`_$tmpl("<div class=\\"a\\"><span>hi</span></div>")`);
    expect(out).not.toContain("_$prop(");
    expect(out).toContain("const v = (() => {");
  });

  test("dynamic attr, event and child become holes with computed paths", () => {
    const out = compile(
      `const v = <tr class={cls}><td onClick={go}>{label}</td></tr>;`,
    );
    expect(out).toContain(`_$tmpl("<tr><td></td></tr>")`);
    expect(out).toContain(`_$prop(_r, "class", cls)`);
    expect(out).toContain(`const _el$1 = _r.firstChild;`); // refs resolve first
    expect(out).toContain(`_$event(_el$1, "click", go)`);
    expect(out).toContain(`_$insert(_el$1, label)`); // last child: append
  });

  test("a mid-position dynamic child gets a <!> marker anchor", () => {
    const out = compile(`const v = <div>a{x}b</div>;`);
    expect(out).toContain(`_$tmpl("<div>a<!>b</div>")`);
    expect(out).toContain(`const _el$1 = _r.firstChild.nextSibling;`);
    expect(out).toContain(`_$insert(_r, x, _el$1)`);
  });

  test("components stay as JSX (the factory handles them)", () => {
    const out = compile(`const v = <Comp a={1} />;`);
    expect(out).toContain("<Comp");
    expect(out).not.toContain("_$tmpl");
  });

  test("a component CHILD inside a compiled tree is an insert hole with JSX source", () => {
    const out = compile(`const v = <div><Comp /></div>;`);
    expect(out).toContain(`_$tmpl("<div></div>")`);
    expect(out).toContain(`_$insert(_r, <Comp />)`);
  });

  test("spread props bail the whole element to the factory", () => {
    const out = compile(`const v = <div {...rest}>x</div>;`);
    expect(out).not.toContain("_$tmpl");
    expect(out).toContain("{...rest}");
  });

  test("svg bails", () => {
    const out = compile(`const v = <svg><path d="M0 0" /></svg>;`);
    expect(out).not.toContain("_$tmpl");
  });

  test("value/checked/ref are always runtime props, even when literal", () => {
    const out = compile(`const v = <input value="x" />;`);
    expect(out).toContain(`_$prop(_r, "value", "x")`);
    expect(out).toContain(`_$tmpl("<input>")`);
  });

  test("boolean shorthand and static className land in the html string", () => {
    const out = compile(
      `const v = <button disabled className="btn">x</button>;`,
    );
    expect(out).toContain(`disabled=\\"\\"`);
    expect(out).toContain(`class=\\"btn\\"`);
  });

  test("non-void self-closing keeps an explicit closing tag", () => {
    const out = compile(`const v = <div><td /><td /></div>;`);
    expect(out).toContain(`<td></td><td></td>`);
  });

  test("static text is escaped", () => {
    const out = compile(`const v = <div>{"a"}</div>;`);
    expect(out).toContain(`_$insert(_r, "a")`);
    const out2 = compile(`const v = <div>5 &lt; 6</div>;`);
    expect(out2).toContain("&lt;");
  });

  test("the runtime import is added once per module", () => {
    const out = compile(`const a = <div>x</div>; const b = <span>y</span>;`);
    const importCount = (
      out.match(/from "@continuum-js\/dom\/compiled"/g) || []
    ).length;
    expect(importCount).toBe(1);
    expect(out).toContain("_tmpl$1");
    expect(out).toContain("_tmpl$2");
  });
});
