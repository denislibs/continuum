// ESLint rules for Continuum. Static heuristics for the pitfalls the docs
// call "common mistakes"; the frp core additionally catches fire-in-pure-zone
// at runtime. Flat-config only.
//
// Design note: `map`/`filter` are NOT statically flagged — they collide with
// Array.prototype and would drown users in false positives. The combinators
// unique to Continuum (`accum`, `accumE`, `snapshot`, `lift2`, `lift3`,
// `hold`) carry the rules; the runtime purity guard covers the rest.
import type { Rule } from "eslint";

// Loose structural view of ESTree + JSX nodes — enough for the checks below
// without dragging in a parser-specific type package.
interface AnyNode {
  type: string;
  [key: string]: unknown;
}

const version = "0.1.0";

// Callbacks of these members run in the transaction's pure zone.
const PURE_CALLBACK_MEMBERS = new Set([
  "accum",
  "accumE",
  "snapshot",
  "lift2",
  "lift3",
]);

// Module-level derivations ending in these members need `.retain()`.
const RETAIN_MEMBERS = new Set(["hold", "accum", "snapshot", "lift2", "lift3"]);

// Globals whose mere use inside a pure callback is an effect or a read of
// the outside world.
const IMPURE_GLOBALS = new Set([
  "localStorage",
  "sessionStorage",
  "document",
  "window",
  "history",
  "navigator",
  "fetch",
]);

function memberName(callee: AnyNode): string | null {
  if (callee.type !== "MemberExpression") return null;
  const prop = callee.property as AnyNode;
  if ((callee.computed as boolean) || prop.type !== "Identifier") return null;
  return prop.name as string;
}

/** Is `node` (an impure thing) inside a function passed to a pure combinator? */
function enclosingPureCombinator(ancestors: AnyNode[]): string | null {
  for (let i = ancestors.length - 1; i > 0; i--) {
    const a = ancestors[i];
    if (
      a.type === "ArrowFunctionExpression" ||
      a.type === "FunctionExpression"
    ) {
      const parent = ancestors[i - 1];
      if (
        parent.type === "CallExpression" &&
        (parent.arguments as AnyNode[]).includes(a)
      ) {
        const name = memberName(parent.callee as AnyNode);
        if (name && PURE_CALLBACK_MEMBERS.has(name)) return name;
      }
    }
  }
  return null;
}

const noImpureCombinators: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow side effects inside pure combinator callbacks (accum/snapshot/lift)",
    },
    messages: {
      impure:
        "Side effect inside a pure `{{combinator}}` callback. Combinator " +
        "functions must be pure — do the dirty work in a handler, `listen`, " +
        "or `perform`, and pass clean data into the network.",
    },
    schema: [],
  },
  create(context) {
    const report = (node: Rule.Node) => {
      const combinator = enclosingPureCombinator(
        context.sourceCode.getAncestors(node) as unknown as AnyNode[],
      );
      if (combinator) {
        context.report({ node, messageId: "impure", data: { combinator } });
      }
    };
    return {
      Identifier(node) {
        const n = node as unknown as AnyNode;
        if (!IMPURE_GLOBALS.has(n.name as string)) return;
        // skip `x.document`-style property positions
        const parent = (node as unknown as { parent: AnyNode }).parent;
        if (
          parent.type === "MemberExpression" &&
          parent.property === n &&
          !(parent.computed as boolean)
        ) {
          return;
        }
        report(node);
      },
      CallExpression(node) {
        const callee = (node as unknown as AnyNode).callee as AnyNode;
        // setX(...) / fireX(...) / dispatch(...)
        if (
          callee.type === "Identifier" &&
          /^(set|fire)[A-Z0-9_]|^dispatch$/.test(callee.name as string)
        ) {
          report(node);
          return;
        }
        // Date.now() / Math.random() — nondeterminism is impurity too
        if (callee.type === "MemberExpression") {
          const obj = callee.object as AnyNode;
          const name = memberName(callee);
          if (
            obj.type === "Identifier" &&
            ((obj.name === "Date" && name === "now") ||
              (obj.name === "Math" && name === "random"))
          ) {
            report(node);
          }
        }
      },
    };
  },
};

const noSampleInJsx: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow rendering sample() into JSX — the value freezes; bind the behavior itself",
    },
    messages: {
      frozen:
        "`sample()` in JSX renders once and never updates. Put the behavior " +
        "itself into JSX for a live binding; `sample()` belongs in handlers.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          memberName((node as unknown as AnyNode).callee as AnyNode) !==
          "sample"
        )
          return;
        const ancestors = context.sourceCode.getAncestors(
          node,
        ) as unknown as AnyNode[];
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const a = ancestors[i];
          // a function boundary first → it's a handler, fine
          if (
            a.type === "ArrowFunctionExpression" ||
            a.type === "FunctionExpression" ||
            a.type === "FunctionDeclaration"
          ) {
            return;
          }
          if (a.type === "JSXExpressionContainer") {
            context.report({ node, messageId: "frozen" });
            return;
          }
        }
      },
    };
  },
};

const requireRetain: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "require .retain() on module-level derivations (they auto-dispose with their last listener)",
    },
    messages: {
      retain:
        "A module-level derivation is disposed when its last listener " +
        "unsubscribes; the next mount then throws. Append `.retain()` for " +
        "intentionally long-lived shared derivations.",
    },
    schema: [],
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        // module scope only: Program, or export at Program level
        const parent = (node as unknown as { parent: AnyNode }).parent;
        const atTop =
          parent.type === "Program" ||
          (parent.type === "ExportNamedDeclaration" &&
            (parent as unknown as { parent: AnyNode }).parent.type ===
              "Program");
        if (!atTop) return;
        for (const decl of (node as unknown as AnyNode)
          .declarations as AnyNode[]) {
          const init = decl.init as AnyNode | null;
          if (!init || init.type !== "CallExpression") continue;
          const name = memberName(init.callee as AnyNode);
          if (name && RETAIN_MEMBERS.has(name)) {
            context.report({
              node: init as unknown as Rule.Node,
              messageId: "retain",
            });
          }
        }
      },
    };
  },
};

// `change` on these input types fires immediately natively — onChange is fine.
const INSTANT_CHANGE_TYPES = new Set(["checkbox", "radio", "file"]);

const preferOninput: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "prefer onInput over onChange on text fields (native change fires on blur)",
    },
    messages: {
      blur:
        "Continuum attaches native listeners: `change` on a text field fires " +
        "only on blur. Use `onInput` (or `bindInput`) to react per keystroke.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: Rule.Node) {
        const attr = node as unknown as AnyNode;
        if ((attr.name as AnyNode).name !== "onChange") return;
        const el = (node as unknown as { parent: AnyNode }).parent;
        const elName = (el.name as AnyNode).name;
        if (elName !== "input" && elName !== "textarea") return;
        if (elName === "input") {
          const typeAttr = (el.attributes as AnyNode[]).find(
            (a) =>
              a.type === "JSXAttribute" &&
              (a.name as AnyNode).name === "type" &&
              (a.value as AnyNode | null)?.type === "Literal",
          );
          const type = typeAttr
            ? String((typeAttr.value as AnyNode).value)
            : "text";
          if (INSTANT_CHANGE_TYPES.has(type)) return;
        }
        context.report({ node, messageId: "blur" });
      },
    };
  },
};

const rules = {
  "no-impure-combinators": noImpureCombinators,
  "no-sample-in-jsx": noSampleInJsx,
  "require-retain": requireRetain,
  "prefer-oninput": preferOninput,
};

const plugin = {
  meta: { name: "@continuum-js/eslint-plugin", version },
  rules,
  configs: {} as {
    recommended: {
      name: string;
      plugins: Record<string, unknown>;
      rules: Record<string, string>;
    };
  },
};

// Flat config: `import continuum from "@continuum-js/eslint-plugin"` →
// `export default [continuum.configs.recommended]`.
plugin.configs.recommended = {
  name: "continuum/recommended",
  plugins: { continuum: plugin },
  rules: {
    "continuum/no-impure-combinators": "error",
    "continuum/no-sample-in-jsx": "error",
    "continuum/require-retain": "warn",
    "continuum/prefer-oninput": "warn",
  },
};

export default plugin;
