import type { Track } from "../types";

// The Streams track: the part that makes Continuum different from a signals
// library — change itself is a value. A Stream is the history of something
// happening; state is a fold over it. Every solution is verified by its check
// in the e2e run, every starter fails it.

export const streams: Track = {
  id: "streams",
  title: "Streams",
  blurb: "Events as first-class values: fold, hold, merge, sample.",
  steps: [
    {
      id: "accum",
      title: "Events are a stream",
      task: `A **stream** is a value that happens — a click, a message, a response.
\`stream()\` makes one; \`.fire\` pushes an occurrence. Fold a stream with
\`.accum(init, (event, acc) => next)\` and you get **state** — the running
result of everything that happened.

**Goal:** count clicks by folding the click stream (no \`.set\`).`,
      starter: `import { stream } from '@continuum-js/frp';

export default function App() {
  const clicks = stream();
  // const count = clicks.accum(0, (_event, n) => n + 1);
  const count = 0;
  return <button onClick={clicks.fire}>clicked {count} times</button>;
}`,
      solution: `import { stream } from '@continuum-js/frp';

export default function App() {
  const clicks = stream();
  const count = clicks.accum(0, (_event, n) => n + 1);
  return <button onClick={clicks.fire}>clicked {count} times</button>;
}`,
      hint: "clicks.accum(0, (_event, n) => n + 1) — it returns a State.",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        click(btn);
        click(btn);
        return /2/.test(container.textContent!);
      },
    },
    {
      id: "hold",
      title: "Hold the latest",
      task: `\`.hold(initial)\` turns a stream of values into a **state** that always
holds the most recent one. Perfect when you only care about "what is it now".

**Goal:** show the letter of the last button pressed (start with \`—\`).`,
      starter: `import { stream } from '@continuum-js/frp';

export default function App() {
  const picks = stream();
  // const current = picks.hold('—');
  const current = '—';
  return (
    <div>
      <button onClick={() => picks.fire('A')}>A</button>
      <button onClick={() => picks.fire('B')}>B</button>
      <p>current: {current}</p>
    </div>
  );
}`,
      solution: `import { stream } from '@continuum-js/frp';

export default function App() {
  const picks = stream();
  const current = picks.hold('—');
  return (
    <div>
      <button onClick={() => picks.fire('A')}>A</button>
      <button onClick={() => picks.fire('B')}>B</button>
      <p>current: {current}</p>
    </div>
  );
}`,
      hint: "const current = picks.hold('—');",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const [, b] = container.querySelectorAll("button");
        click(b);
        return /current:\s*B/.test(container.textContent!);
      },
    },
    {
      id: "filter",
      title: "Filter a stream",
      task: `Streams have the operators you'd expect: \`.map\` transforms each
occurrence, \`.filter\` drops the ones that don't match — before they ever
reach state.

**Goal:** count only the **even** ticks. Clicking fires 1, 2, 3, … in turn.`,
      starter: `import { stream } from '@continuum-js/frp';

export default function App() {
  const ticks = stream();
  // keep only even numbers, then count them
  const evens = ticks;
  const count = evens.accum(0, (_n, c) => c + 1);
  let n = 0;
  return (
    <div>
      <button onClick={() => ticks.fire(++n)}>tick</button>
      <p>evens: {count}</p>
    </div>
  );
}`,
      solution: `import { stream } from '@continuum-js/frp';

export default function App() {
  const ticks = stream();
  const evens = ticks.filter((n) => n % 2 === 0);
  const count = evens.accum(0, (_n, c) => c + 1);
  let n = 0;
  return (
    <div>
      <button onClick={() => ticks.fire(++n)}>tick</button>
      <p>evens: {count}</p>
    </div>
  );
}`,
      hint: "ticks.filter((n) => n % 2 === 0)",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        click(btn);
        click(btn);
        click(btn);
        click(btn); // fires 1,2,3,4 → evens are 2 and 4
        return /evens:\s*2/.test(container.textContent!);
      },
    },
    {
      id: "or",
      title: "Merge two sources",
      task: `\`.or\` merges two streams of the same type into one. Map each source to
its meaning first, then fold the merged stream once.

**Goal:** one total fed by a **+1** button and a **+10** button.`,
      starter: `import { stream } from '@continuum-js/frp';

export default function App() {
  const plus1 = stream();
  const plus10 = stream();
  // merge: plus1.mapTo(1).or(plus10.mapTo(10))
  const bumps = plus1.mapTo(1);
  const total = bumps.accum(0, (d, n) => n + d);
  return (
    <div>
      <button onClick={plus1.fire}>+1</button>
      <button onClick={plus10.fire}>+10</button>
      <p>total: {total}</p>
    </div>
  );
}`,
      solution: `import { stream } from '@continuum-js/frp';

export default function App() {
  const plus1 = stream();
  const plus10 = stream();
  const bumps = plus1.mapTo(1).or(plus10.mapTo(10));
  const total = bumps.accum(0, (d, n) => n + d);
  return (
    <div>
      <button onClick={plus1.fire}>+1</button>
      <button onClick={plus10.fire}>+10</button>
      <p>total: {total}</p>
    </div>
  );
}`,
      hint: "plus1.mapTo(1).or(plus10.mapTo(10))",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const [p1, p10] = container.querySelectorAll("button");
        click(p1);
        click(p10);
        return /total:\s*11/.test(container.textContent!);
      },
    },
    {
      id: "at",
      title: "Sample state at an event",
      task: `\`.at(stream)\` reads a state's value **at the moment** a stream fires —
the classic "submit" shape: capture the draft when the button is clicked, not
on every keystroke.

**Goal:** show the text as it was when **submit** was pressed.`,
      starter: `import { stream, state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const draft = state('');
  const submit = stream();
  // capture draft at submit, then hold it
  const submitted = draft.hold('—');
  return (
    <div>
      <input {...bindInput(draft, draft.set)} />
      <button onClick={submit.fire}>submit</button>
      <p>last: {submitted}</p>
    </div>
  );
}`,
      solution: `import { stream, state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const draft = state('');
  const submit = stream();
  const submitted = draft.at(submit).hold('—');
  return (
    <div>
      <input {...bindInput(draft, draft.set)} />
      <button onClick={submit.fire}>submit</button>
      <p>last: {submitted}</p>
    </div>
  );
}`,
      hint: "draft.at(submit) is a stream of the draft's value at each submit; hold it.",
      check: ({ render, type, click, App }) => {
        const { container } = render(App);
        const input = container.querySelector("input")!;
        type(input, "hi");
        click(container.querySelector("button")!);
        return /last:\s*hi/.test(container.textContent!);
      },
    },
    {
      id: "on",
      title: "Many sources, one state",
      task: `\`state(init).on(stream, reducer)\` folds a stream into the state, and you
can chain \`.on\` for several sources — each a \`(state, event) => state\` step.

**Goal:** a counter with **+** and **−**.`,
      starter: `import { stream, state } from '@continuum-js/frp';

export default function App() {
  const inc = stream();
  const dec = stream();
  const count = state(0).on(inc, (n) => n + 1);
  return (
    <div>
      <button onClick={inc.fire}>+</button>
      <button onClick={dec.fire}>−</button>
      <p>{count}</p>
    </div>
  );
}`,
      solution: `import { stream, state } from '@continuum-js/frp';

export default function App() {
  const inc = stream();
  const dec = stream();
  const count = state(0)
    .on(inc, (n) => n + 1)
    .on(dec, (n) => n - 1);
  return (
    <div>
      <button onClick={inc.fire}>+</button>
      <button onClick={dec.fire}>−</button>
      <p>{count}</p>
    </div>
  );
}`,
      hint: "Chain another: .on(dec, (n) => n - 1)",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const [plus, minus] = container.querySelectorAll("button");
        click(plus);
        click(plus);
        click(plus);
        click(minus); // 3 − 1 = 2
        return /2/.test(container.querySelector("p")!.textContent!);
      },
    },
  ],
};
