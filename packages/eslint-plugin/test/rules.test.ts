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
    `const onClick = () => { alert("saved"); setTimeout(poll, 100); };`,
    // Array.prototype.map is not in the flagged set
    `const ids = items.map((t) => { fetch("/api"); return t.id; });`,
    // reading captured values is fine (pure sample-on-event join)
    `const s = held.at(clicks, (now, e) => now + e);`,
    // pure free-function join
    `const s = combine(a, b, (x, y) => x + y);`,
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
      code: `const p = held.at(clicks, (now, e) => { localStorage.setItem("k", String(now)); return now; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const v = count.at(clicks, (v) => { fetch("/x"); return v; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const j = combine(a, b, (x, y) => { setTotal(x + y); return x; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const j = combine(a, b, (x, y) => { fetch("/log"); return x; });`,
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
    {
      code: `const x = src.accum(0, (a, n) => { alert(a); return n; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accum(0, (a, n) => (confirm("sure?") ? n + 1 : n));`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accum(0, (a, n) => { setTimeout(() => {}, 0); return n; });`,
      errors: [{ messageId: "impure" }],
    },
    {
      code: `const x = src.accum(0, (a, n) => { queueMicrotask(() => {}); return n; });`,
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

tester.run("state-needs-scope", plugin.rules["state-needs-scope"], {
  valid: [
    // the documented idiom for app-level state
    `export const count = root(() => clicks.accum(0, (n) => n + 1));`,
    // sources are leaves — no owner needed
    `export const cart = state([]);`,
    `export const clicks = stream();`,
    // inside a function/component the ambient scope owns it
    `function App() { const held = src.hold(0); return held; }`,
    // Array-ish chains are not flagged (hold/accum only)
    `const ids = ITEMS.map((x) => x.id);`,
  ],
  invalid: [
    {
      code: `export const held = src.hold(0);`,
      errors: [{ messageId: "scope" }],
    },
    {
      code: `const total = actions.accum(0, (a, n) => n + 1);`,
      errors: [{ messageId: "scope" }],
    },
    {
      code: `export const res = perform(requests, fetcher);`,
      errors: [{ messageId: "scope" }],
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
  test("states every rule under the continuum namespace", () => {
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

tester.run(
  "no-layout-reads-in-effects",
  plugin.rules["no-layout-reads-in-effects"],
  {
    valid: [
      // the component body is not the effect zone
      `function C() { const h = el.offsetHeight; return <div />; }`,
      // event handlers are not effects
      `const v = <input onClick={() => el.focus()} />;`,
      // measure() is where reads belong
      `const h = measure(inserted, () => list.scrollHeight);`,
      // an explicit opt-out inside an effect
      `onMount(() => forceMeasure(() => widget.init(el.getBoundingClientRect())));`,
      `x.listen(() => withLayout(() => el.offsetWidth));`,
      // writes are not reads
      `x.listen((top) => { list.scrollTop = top; });`,
      `onMount(() => { el.scrollLeft = 0; });`,
      // a same-named property on a non-layout object is still flagged — but
      // an unrelated member name is not
      `x.listen(() => el.offsetParentId);`,
    ],
    invalid: [
      {
        code: `x.listen(() => { const h = el.offsetHeight; });`,
        errors: [{ messageId: "read" }],
      },
      {
        code: `onMount(() => el.getBoundingClientRect());`,
        errors: [{ messageId: "read" }],
      },
      {
        code: `onMount(() => input.focus());`,
        errors: [{ messageId: "read" }],
      },
      {
        code: `perform(req, async () => { const w = window.innerWidth; return w; });`,
        errors: [{ messageId: "read" }],
      },
      {
        code: `total.on(e, (acc) => acc + el.clientWidth);`,
        errors: [{ messageId: "read" }],
      },
      {
        code: `x.listen(() => { list.scrollTop += 10; });`, // a compound write reads
        errors: [{ messageId: "read" }],
      },
      {
        code: `x.listen(() => getComputedStyle(el).width);`,
        errors: [{ messageId: "read" }],
      },
      {
        code: `onMount(() => { measure(t, () => 1); el.scrollIntoView(); });`, // the read is outside the measure callback
        errors: [{ messageId: "read" }],
      },
    ],
  },
);
