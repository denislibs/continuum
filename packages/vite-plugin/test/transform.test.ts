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

  test("generated clone var doesn't capture a user identifier named _r (#121)", () => {
    const out = compile(`const _r = getData(); const v = <div>{_r}</div>;`);
    expect(out).toContain(`const _r$2 = _tmpl$1();`);
    expect(out).toContain(`_$insert(_r$2, _r)`); // inserts the user's _r
    expect(out).toContain(`return _r$2;`); // returns the clone, not the user's _r
  });

  test("a renamed clone var is also returned, not the user binding (#121)", () => {
    // `_r` referenced anywhere in the module bumps the clone var (hasReference
    // is module-wide) — the IIFE must return the clone, not the (here unbound
    // at module scope, or TDZ) user `_r`.
    const unrelated = compile(
      `function h2() { const _r = 1; return _r; } const v = <div>{x}</div>;`,
    );
    expect(unrelated).toContain(`const _r$2 = _tmpl$1();`);
    expect(unrelated).toContain(`return _r$2;`); // the compiled IIFE returns the clone

    // TDZ variant: no user `return _r;` anywhere, so the compiled return must
    // be the renamed clone, never a bare `return _r;`.
    const tdz = compile(`const v = <div>{x}</div>; const _r = 1;`);
    expect(tdz).toContain(`return _r$2;`);
    expect(tdz).not.toMatch(/return _r;/);
  });

  test("the compiled IIFE yields the cloned element, not the captured binding (#121)", () => {
    // runtime-shaped: strip the import, stub the runtime, and evaluate.
    const src = compile(`const _r = getData(); const v = <div>{_r}</div>;`);
    const body = src.replace(/^import[^\n]*\n/m, "");
    const el = { __clone: true };
    const fn = new Function(
      "_$tmpl",
      "_$insert",
      "_$prop",
      "_$event",
      "getData",
      `${body}\nreturn v;`,
    );
    const v = fn(
      () => () => el, // _$tmpl(html) -> factory -> element
      () => {},
      () => {},
      () => {},
      () => "USER_VALUE", // getData()
    );
    expect(v).toBe(el); // the element, NOT "USER_VALUE"
  });

  test("runtime import names don't collide with a user declaration (#121)", () => {
    const out = compile(`const _$insert = 1; const v = <div>{x}</div>;`);
    expect(out).toContain(`insert as _$insert$2`);
    expect(out).toContain(`_$insert$2(_r, x)`);
    const importCount = (
      out.match(/from "@continuum-js\/dom\/compiled"/g) || []
    ).length;
    expect(importCount).toBe(1); // still one import, no duplicate declaration
  test("empty expression container between text keeps sibling paths correct (#114)", () => {
    const out = compile(
      `const v = <div>Hello {/* i18n */} world <button onClick={go}>OK</button></div>;`,
    );
    // the two text runs merge into ONE text node, so the button is
    // firstChild.nextSibling — not .nextSibling.nextSibling (which was null).
    expect(out).toContain(
      `_$tmpl("<div>Hello  world <button>OK</button></div>")`,
    );
    expect(out).toContain(`const _el$1 = _r.firstChild.nextSibling;`);
    expect(out).toContain(`_$event(_el$1, "click", go)`);
  });

  test("empty container before a mid-position element anchors correctly (#114)", () => {
    const out = compile(`const v = <div>a{/* */}b<span>{y}</span></div>;`);
    expect(out).toContain(`_$tmpl("<div>ab<span></span></div>")`);
    expect(out).toContain(`const _el$1 = _r.firstChild.nextSibling;`); // the <span>
    expect(out).toContain(`_$insert(_el$1, y)`); // y appended into the span
  });

  test("a top-level sequence expression in a hole is parenthesized (#122)", () => {
    // prop hole
    const out = compile(`const v = <div class={(a, b)}>x</div>;`);
    expect(out).toContain(`_$prop(_r, "class", (a, b))`);
    // event hole
    const out2 = compile(`const v = <button onClick={(a, b)}>x</button>;`);
    expect(out2).toContain(`_$event(_r, "click", (a, b))`);
    // child insert hole (with a following sibling → anchored insert)
    const out3 = compile(`const v = <div>{(a, b)}<span /></div>;`);
    expect(out3).toContain(`_$insert(_r, (a, b), _el$1)`);
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
