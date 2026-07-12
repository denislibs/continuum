// The JSX → cloned-template transform. Ordinary Continuum JSX compiles into
// calls to @continuum-js/dom/compiled: statics are glued into ONE html
// string parsed once per call site; dynamics become "holes" bound through
// the same insertChild/applyProp/applyEvent semantics as the runtime
// factory. Anything the compiler is not statically sure about is LEFT AS
// JSX — the downstream esbuild pass turns it into the runtime factory call,
// so correctness never depends on the compiler being smart.
import type * as BabelCore from "@babel/core";
import type { PluginObj, PluginPass } from "@babel/core";
import type * as t from "@babel/types";

// SVG needs namespace-aware creation — out of scope for v1, bail to h().
const SVG_TAGS = new Set(
  "svg g defs symbol use image switch foreignObject path rect circle ellipse line polyline polygon text tspan textPath marker desc metadata view linearGradient radialGradient stop clipPath mask pattern filter feGaussianBlur feOffset feBlend feColorMatrix feComposite feFlood feMerge feMergeNode feImage feTile feMorphology feDisplacementMap feTurbulence animate animateTransform animateMotion mpath set".split(
    " ",
  ),
);

// Must go through prop() even when literal: value/checked are DOM properties
// (not attributes), ref runs a callback. Raw-HTML props are refused outright
// (the "dangerously"-prefixed React one included) — bail to the factory.
const FORCED_DYNAMIC = new Set(["value", "checked", "ref"]);

// HTML void elements: no closing tag in serialized form.
const VOID_TAGS = new Set(
  "area base br col embed hr img input link meta source track wbr".split(" "),
);

const escapeText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, "&quot;");

// Babel's JSXText whitespace semantics (cleanJSXElementLiteralChild).
function cleanJsxText(raw: string): string {
  const lines = raw.split(/\r\n|\n|\r/);
  let lastNonEmpty = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/[^ \t]/.test(lines[i])) lastNonEmpty = i;
  }
  let out = "";
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\t/g, " ");
    if (i !== 0) line = line.replace(/^ +/, "");
    if (i !== lines.length - 1) line = line.replace(/ +$/, "");
    if (line) {
      if (i !== lastNonEmpty) line += " ";
      out += line;
    }
  }
  return out;
}

type Step = "first" | "next";

interface Hole {
  kind: "prop" | "event" | "insert";
  path: Step[]; // to the element (prop/event) or the marker (insert)
  key?: string;
  code: string;
  parentPath?: Step[]; // insert: the parent element
  append?: boolean; // insert without marker (last child)
}

interface Compiled {
  html: string;
  holes: Hole[];
}

class Bail extends Error {}

// Walk one intrinsic element, accumulating the html string and the holes.
function compileElement(
  el: t.JSXElement,
  path: Step[],
  out: Compiled,
  exprSource: (n: t.Node) => string,
): void {
  const opening = el.openingElement;
  if (opening.name.type !== "JSXIdentifier") throw new Bail();
  const tag = opening.name.name;
  if (!/^[a-z]/.test(tag) || SVG_TAGS.has(tag)) throw new Bail();

  let html = `<${tag}`;
  const dynamic: Array<{ event: boolean; key: string; code: string }> = [];
  for (const attr of opening.attributes) {
    if (attr.type !== "JSXAttribute") throw new Bail(); // spread → factory
    if (attr.name.type !== "JSXIdentifier") throw new Bail(); // namespaced
    const name = attr.name.name;
    if (name.toLowerCase().includes("innerhtml")) throw new Bail();
    const isEvent = name.length > 2 && name.startsWith("on");
    const v = attr.value;
    if (v == null) {
      // boolean shorthand: <input disabled />
      if (isEvent || FORCED_DYNAMIC.has(name)) throw new Bail();
      html += ` ${name}=""`;
      continue;
    }
    if (v.type === "StringLiteral" && !isEvent) {
      if (FORCED_DYNAMIC.has(name)) {
        dynamic.push({
          event: false,
          key: name,
          code: JSON.stringify(v.value),
        });
        continue;
      }
      const attrName =
        name === "className" ? "class" : name === "htmlFor" ? "for" : name;
      html += ` ${attrName}="${escapeAttr(v.value)}"`;
      continue;
    }
    if (v.type === "JSXExpressionContainer") {
      const inner = v.expression;
      if (inner.type === "JSXEmptyExpression") continue;
      dynamic.push({
        event: isEvent,
        key: isEvent ? name.slice(2).toLowerCase() : name,
        code: exprSource(inner),
      });
      continue;
    }
    throw new Bail();
  }
  for (const d of dynamic) {
    out.holes.push({
      kind: d.event ? "event" : "prop",
      path: [...path],
      key: d.key,
      code: d.code,
    });
  }
  out.html += html;

  const kids = el.children.filter((c) => {
    if (c.type === "JSXText") return cleanJsxText(c.value) !== "";
    if (
      c.type === "JSXExpressionContainer" &&
      c.expression.type === "JSXEmptyExpression"
    )
      return false;
    return true;
  });

  if (VOID_TAGS.has(tag)) {
    if (kids.length > 0) throw new Bail(); // children on a void element?!
    out.html += ">";
    return;
  }
  // non-void self-closing JSX still needs an explicit closing tag in HTML —
  // "<div/>" would swallow its following siblings in the parser
  out.html += ">";

  for (let i = 0; i < kids.length; i++) {
    const kid = kids[i];
    const myPath: Step[] = [
      ...path,
      "first",
      ...(Array(i).fill("next") as Step[]),
    ];
    if (kid.type === "JSXText") {
      out.html += escapeText(cleanJsxText(kid.value));
      continue;
    }
    const isLast = i === kids.length - 1;
    if (kid.type === "JSXExpressionContainer") {
      const inner = kid.expression;
      if (inner.type === "JSXEmptyExpression") continue;
      if (isLast) {
        out.holes.push({
          kind: "insert",
          path: [],
          parentPath: [...path],
          code: exprSource(inner),
          append: true,
        });
      } else {
        out.html += "<!>";
        out.holes.push({
          kind: "insert",
          path: myPath,
          parentPath: [...path],
          code: exprSource(inner),
        });
      }
      continue;
    }
    if (kid.type === "JSXElement") {
      const name = kid.openingElement.name;
      const isIntrinsic =
        name.type === "JSXIdentifier" && /^[a-z]/.test(name.name);
      if (isIntrinsic) {
        compileElement(kid, myPath, out, exprSource); // Bail bubbles up
        continue;
      }
      // component child: an expression hole; the JSX source stays and the
      // esbuild pass compiles it to the runtime factory call
      if (isLast) {
        out.holes.push({
          kind: "insert",
          path: [],
          parentPath: [...path],
          code: exprSource(kid),
          append: true,
        });
      } else {
        out.html += "<!>";
        out.holes.push({
          kind: "insert",
          path: myPath,
          parentPath: [...path],
          code: exprSource(kid),
        });
      }
      continue;
    }
    throw new Bail(); // fragments and exotica inside an element
  }
  out.html += `</${tag}>`;
}

function pathExpr(rootVar: string, steps: Step[]): string {
  let e = rootVar;
  for (const s of steps) e += s === "first" ? ".firstChild" : ".nextSibling";
  return e;
}

interface State extends PluginPass {
  templates?: Array<{ id: string; html: string }>;
  counter?: number;
}

export function continuumJsx(babel: typeof BabelCore): PluginObj<State> {
  const exprSource = (n: t.Node): string => generateCode(babel, n);

  return {
    name: "continuum-jsx-templates",
    visitor: {
      Program: {
        enter(_p, state) {
          state.templates = [];
          state.counter = 0;
        },
        exit(programPath, state) {
          if (!state.templates || state.templates.length === 0) return;
          const decls = state.templates
            .map((tp) => `const ${tp.id} = _$tmpl(${JSON.stringify(tp.html)});`)
            .join("\n");
          const importLine = `import { tmpl as _$tmpl, insert as _$insert, prop as _$prop, event as _$event } from "@continuum-js/dom/compiled";`;
          const file = babel.parseSync(`${importLine}\n${decls}`, {
            babelrc: false,
            configFile: false,
          });
          if (file && file.type === "File") {
            programPath.unshiftContainer("body", file.program.body);
          }
        },
      },
      JSXElement(elPath, state) {
        const node = elPath.node;
        const name = node.openingElement.name;
        if (name.type !== "JSXIdentifier" || !/^[a-z]/.test(name.name)) return;
        // compile ROOTS only: an intrinsic parent compiles (or bails) the
        // whole subtree itself
        const parent = elPath.parentPath;
        if (parent.isJSXElement()) {
          const pn = parent.node.openingElement.name;
          if (pn.type === "JSXIdentifier" && /^[a-z]/.test(pn.name)) return;
        }
        const out: Compiled = { html: "", holes: [] };
        try {
          compileElement(node, [], out, exprSource);
        } catch (e) {
          if (e instanceof Bail) return; // leave as JSX for the factory
          throw e;
        }
        const id = `_tmpl$${++state.counter!}`;
        state.templates!.push({ id, html: out.html });
        // Resolve EVERY node reference before the first mutation: inserts
        // splice new children in, which would invalidate later
        // firstChild/nextSibling walks.
        const refs = new Map<string, string>(); // path-expr -> var
        const refVar = (steps: Step[]): string => {
          const expr = pathExpr("_r", steps);
          if (expr === "_r") return "_r";
          let v = refs.get(expr);
          if (!v) {
            v = `_el$${refs.size + 1}`;
            refs.set(expr, v);
          }
          return v;
        };
        const ops: string[] = [];
        for (const h of out.holes) {
          if (h.kind === "prop") {
            ops.push(
              `_$prop(${refVar(h.path)}, ${JSON.stringify(h.key)}, ${h.code});`,
            );
          } else if (h.kind === "event") {
            ops.push(
              `_$event(${refVar(h.path)}, ${JSON.stringify(h.key)}, ${h.code});`,
            );
          } else if (h.append) {
            ops.push(`_$insert(${refVar(h.parentPath!)}, ${h.code});`);
          } else {
            ops.push(
              `_$insert(${refVar(h.parentPath!)}, ${h.code}, ${refVar(h.path)});`,
            );
          }
        }
        const lines: string[] = [`const _r = ${id}();`];
        for (const [expr, v] of refs) lines.push(`const ${v} = ${expr};`);
        lines.push(...ops);
        lines.push("return _r;");
        // parser `plugins` rides through TemplateBuilderOptions untyped
        const tplOpts = {
          placeholderPattern: false,
          plugins: ["jsx", "typescript"],
        } as import("@babel/template").TemplateBuilderOptions;
        const build = babel.template.expression(
          `(() => { ${lines.join(" ")} })()`,
          tplOpts,
        );
        // inside a surviving JSX parent (a component or fragment) the
        // replacement must live in an expression container
        const expr = build();
        const inJsx =
          elPath.parentPath.isJSXElement() || elPath.parentPath.isJSXFragment();
        elPath.replaceWith(
          inJsx ? babel.types.jsxExpressionContainer(expr) : expr,
        );
        elPath.skip();
      },
    },
  };
}

// @babel/core does not re-export its generator; go through transformFromAst
// on a minimal wrapper to stringify one expression.
function generateCode(babel: typeof BabelCore, n: t.Node): string {
  const expr = n as t.Expression;
  const program = babel.types.program([babel.types.expressionStatement(expr)]);
  const res = babel.transformFromAstSync(babel.types.file(program), undefined, {
    babelrc: false,
    configFile: false,
    generatorOpts: { compact: true },
    code: true,
  });
  let code = res?.code ?? "";
  code = code.trim();
  if (code.endsWith(";")) code = code.slice(0, -1);
  return code;
}
