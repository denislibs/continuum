// The plugin's contract, rule by rule. ESLint 10's RuleTester integrates
// with vitest: `tester.run` generates its own describe/it blocks, so it is
// called at the top level, not inside `test()`.
import { describe, test } from "vitest";
import { RuleTester } from "eslint";
import plugin from "../src/index.js";

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-impure-combinators", plugin.rules["no-impure-combinators"], {
  valid: [
    // pure reducer
    `const todos = actions.accum([], (a, acc) => [...acc, a]);`,
    // effects are fine outside combinators
    `const onSubmit = () => { fetch("/api"); dispatch({ type: "x" }); };`,
    // Array.prototype.map is not in the flagged set
    `const ids = items.map((t) => { fetch("/api"); return t.id; });`,
    // reading captured values is fine
    `const s = src.snapshot(held, (now, prev) => now + prev);`,
  ],
  invalid: [
    {
      code: `const todos = submits.accum([], (e, acc) => { const el = document.querySelector("input"); return acc; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accum(0, (a, n) => { fireOther(a); return n; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accumE(0, (a, n) => { dispatch({ type: "x" }); return n; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const p = src.snapshot(held, (now, prev) => { localStorage.setItem("k", String(now)); return prev; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const j = Behavior.lift2((x, y) => { setTotal(x + y); return x; }, a, b);`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accum(0, (a, n) => n + Math.random());`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accum(0, (a, n) => { fetch("/log"); return n; });`,
      errors: [{ messageId: "impure" }],
    },
  ],
});

tester.run("no-sample-in-jsx", plugin.rules["no-sample-in-jsx"], {
  valid: [
    // the behavior itself is the live binding
    `const view = <div>{count}</div>;`,
    // sample in a handler is the idiom
    `const view = <button onClick={() => setCount(count.sample() + 1)}>+</button>;`,
    // sample outside JSX entirely
    `const n = count.sample();`,
  ],
  invalid: [
    {
      code: `const view = <div>{count.sample()}</div>;`,
      errors: [{ messageId: "frozen" }],
    },
    {
      code: `const view = <input value={text.sample()} />;`,
      errors: [{ messageId: "frozen" }],
    },
  ],
});

tester.run("require-retain", plugin.rules["require-retain"], {
  valid: [
    // retained — the documented idiom for shared module-level derivations
    `export const held = src.hold(0).retain();`,
    // sources are pinned automatically
    `export const [cart, setCart] = newBehavior([]);`,
    // inside a function/component the ownership tree manages it
    `function App() { const held = src.hold(0); return held; }`,
    // Array-ish chains are not flagged (hold/accum/snapshot only)
    `const ids = ITEMS.map((x) => x.id);`,
  ],
  invalid: [
    {
      code: `export const held = src.hold(0);`,
      errors: [{ messageId: "retain" }],
    },
    {
      code: `const total = actions.accum(0, (a, n) => n + 1);`,
      errors: [{ messageId: "retain" }],
    },
    {
      code: `export const pairs = src.snapshot(held, (a, b) => a + b);`,
      errors: [{ messageId: "retain" }],
    },
  ],
});

tester.run("prefer-oninput", plugin.rules["prefer-oninput"], {
  valid: [
    `const v = <input onInput={(e) => setText(e.target.value)} />;`,
    // native change is instant for checkbox/radio — onChange is fine
    `const v = <input type="checkbox" onChange={(e) => toggle(e)} />;`,
    `const v = <input type="radio" onChange={(e) => pick(e)} />;`,
    // select fires change on selection — fine
    `const v = <select onChange={(e) => choose(e)} />;`,
  ],
  invalid: [
    {
      code: `const v = <input onChange={(e) => setText(e.target.value)} />;`,
      errors: [{ messageId: "blur" }],
    },
    {
      code: `const v = <textarea onChange={(e) => setText(e.target.value)} />;`,
      errors: [{ messageId: "blur" }],
    },
    {
      code: `const v = <input type="text" onChange={(e) => setText(e.target.value)} />;`,
      errors: [{ messageId: "blur" }],
    },
  ],
});

describe("recommended config", () => {
  test("wires every rule under the continuum namespace", () => {
    const rec = plugin.configs.recommended;
    for (const name of Object.keys(plugin.rules)) {
      if (!rec.rules[`continuum/${name}`]) {
        throw new Error(`rule ${name} missing from recommended`);
      }
    }
    if (rec.plugins.continuum !== plugin) {
      throw new Error("recommended config must reference the plugin itself");
    }
  });
});
