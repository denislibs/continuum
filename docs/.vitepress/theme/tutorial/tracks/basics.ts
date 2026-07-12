import type { Track } from "../types";

// The Basics track: state, updates, folding events, derived values, combining,
// inputs, conditionals, lists. Every solution is verified by its own check in
// tutorial.test.ts, and every starter is verified to FAIL that check — so a
// learner who just runs the starter sees red, and the solution turns it green.

export const basics: Track = {
  id: "basics",
  title: "Basics",
  blurb: "State, derived values, and rendering — the core loop.",
  steps: [
    {
      id: "state",
      title: "A piece of state",
      task: `Everything reactive in Continuum starts with **state** — a value that
changes over time. Create one with \`state(initial)\` and drop it straight
into JSX; Continuum wires the text node to it.

**Goal:** render a paragraph showing the number \`0\`.`,
      starter: `import { state } from '@continuum-js/frp';

export default function App() {
  const count = state(0);
  // render <p>{count}</p>
  return <p></p>;
}`,
      solution: `import { state } from '@continuum-js/frp';

export default function App() {
  const count = state(0);
  return <p>{count}</p>;
}`,
      hint: "Put the state directly between the tags: <p>{count}</p>.",
      check: ({ render, App }) => {
        const { container } = render(App);
        return container.textContent!.trim() === "0";
      },
    },
    {
      id: "set",
      title: "Change it",
      task: `A state holds its current value (read it with \`.sample()\`) and you can
replace it with \`.set(next)\`. Nothing re-renders — only the bound text node
is patched.

**Goal:** clicking the button should increase the count.`,
      starter: `import { state } from '@continuum-js/frp';

export default function App() {
  const count = state(0);
  return (
    <button onClick={() => { /* set count to count + 1 */ }}>
      clicked {count} times
    </button>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';

export default function App() {
  const count = state(0);
  return (
    <button onClick={() => count.set(count.sample() + 1)}>
      clicked {count} times
    </button>
  );
}`,
      hint: "count.set(count.sample() + 1)",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        click(btn);
        click(btn);
        return /2/.test(container.textContent!);
      },
    },
    {
      id: "on",
      title: "Fold events into state",
      task: `Manually reading and setting works, but the idiomatic way is to fold a
**stream** of events into state. \`stream()\` makes an event source; \`.on\`
transitions the state on each event.

**Goal:** rebuild the counter with \`stream\` + \`.on\` instead of \`.set\`.`,
      starter: `import { stream, state } from '@continuum-js/frp';

export default function App() {
  const clicks = stream();
  // fold clicks into count: state(0).on(clicks, n => n + 1)
  const count = state(0);
  return <button onClick={clicks.fire}>clicked {count} times</button>;
}`,
      solution: `import { stream, state } from '@continuum-js/frp';

export default function App() {
  const clicks = stream();
  const count = state(0).on(clicks, (n) => n + 1);
  return <button onClick={clicks.fire}>clicked {count} times</button>;
}`,
      hint: "const count = state(0).on(clicks, (n) => n + 1);",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        click(btn);
        click(btn);
        click(btn);
        return /3/.test(container.textContent!);
      },
    },
    {
      id: "map",
      title: "Derived values",
      task: `A derived value is just another state computed from an existing one with
\`.map\`. It updates automatically and needs no extra bookkeeping.

**Goal:** show both the count and its double, e.g. \`0 / 0\`, \`1 / 2\`.`,
      starter: `import { state } from '@continuum-js/frp';

export default function App() {
  const count = state(1);
  // const doubled = count.map(n => n * 2);
  return <p>{count} / </p>;
}`,
      solution: `import { state } from '@continuum-js/frp';

export default function App() {
  const count = state(1);
  const doubled = count.map((n) => n * 2);
  return <p>{count} / {doubled}</p>;
}`,
      hint: "count.map((n) => n * 2)",
      check: ({ render, App }) => {
        const { container } = render(App);
        return container.textContent!.replace(/\s/g, "") === "1/2";
      },
    },
    {
      id: "combine",
      title: "Combine two states",
      task: `To derive a value from **several** states, use \`combine\`. It recomputes
whenever any input changes.

**Goal:** render the sum of \`a\` (3) and \`b\` (4) — expect \`7\`.`,
      starter: `import { state, combine } from '@continuum-js/frp';

export default function App() {
  const a = state(3);
  const b = state(4);
  // const sum = combine(a, b, (x, y) => x + y);
  return <p></p>;
}`,
      solution: `import { state, combine } from '@continuum-js/frp';

export default function App() {
  const a = state(3);
  const b = state(4);
  const sum = combine(a, b, (x, y) => x + y);
  return <p>{sum}</p>;
}`,
      hint: "combine(a, b, (x, y) => x + y)",
      check: ({ render, App }) => {
        const { container } = render(App);
        return container.textContent!.trim() === "7";
      },
    },
    {
      id: "input",
      title: "A controlled input",
      task: `\`bindInput\` connects an \`<input>\` to a string state: spread it onto the
element and the state tracks what the user types.

**Goal:** echo the typed text into the paragraph below the input.`,
      starter: `import { state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const name = state('');
  return (
    <div>
      <input {...bindInput(name, name.set)} />
      <p>Hello </p>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const name = state('');
  return (
    <div>
      <input {...bindInput(name, name.set)} />
      <p>Hello {name}</p>
    </div>
  );
}`,
      hint: "Interpolate the state: <p>Hello {name}</p>.",
      check: ({ render, type, App }) => {
        const { container } = render(App);
        const input = container.querySelector("input")!;
        type(input, "Ada");
        return container.textContent!.includes("Hello Ada");
      },
    },
    {
      id: "show",
      title: "Conditional rendering",
      task: `\`<Show>\` mounts its children only when a state is truthy, and an optional
\`fallback\` otherwise. The subtree is built once and kept — not re-created on
every change.

**Goal:** show \`"Even"\` when the count is even, \`"Odd"\` when it is odd.`,
      starter: `import { state } from '@continuum-js/frp';
import { Show } from '@continuum-js/dom';

export default function App() {
  const count = state(0);
  const isEven = count.map((n) => n % 2 === 0);
  return (
    <div>
      <button onClick={() => count.set(count.sample() + 1)}>next</button>
      {/* <Show when={isEven} fallback={() => <span>Odd</span>}>
            {() => <span>Even</span>}
          </Show> */}
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { Show } from '@continuum-js/dom';

export default function App() {
  const count = state(0);
  const isEven = count.map((n) => n % 2 === 0);
  return (
    <div>
      <button onClick={() => count.set(count.sample() + 1)}>next</button>
      <Show when={isEven} fallback={() => <span>Odd</span>}>
        {() => <span>Even</span>}
      </Show>
    </div>
  );
}`,
      hint: "Uncomment the <Show> block — when is isEven, fallback renders Odd.",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        if (!/Even/.test(container.textContent!)) return false;
        click(container.querySelector("button")!);
        return /Odd/.test(container.textContent!);
      },
    },
    {
      id: "list",
      title: "A keyed list",
      task: `\`<Each>\` renders a list from a state of arrays, keyed by \`by\`. When the
array changes it moves and patches existing rows instead of rebuilding them.

**Goal:** render one \`<li>\` per fruit.`,
      starter: `import { state } from '@continuum-js/frp';
import { Each } from '@continuum-js/dom';

export default function App() {
  const fruits = state(['apple', 'pear', 'plum']);
  return (
    <ul>
      {/* <Each each={fruits} by={(f) => f}>
            {(f) => <li>{f}</li>}
          </Each> */}
    </ul>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { Each } from '@continuum-js/dom';

export default function App() {
  const fruits = state(['apple', 'pear', 'plum']);
  return (
    <ul>
      <Each each={fruits} by={(f) => f}>
        {(f) => <li>{f}</li>}
      </Each>
    </ul>
  );
}`,
      hint: "Uncomment the <Each> block; key by the fruit itself: by={(f) => f}.",
      check: ({ render, App }) => {
        const { container } = render(App);
        return container.querySelectorAll("li").length === 3;
      },
    },
  ],
};
