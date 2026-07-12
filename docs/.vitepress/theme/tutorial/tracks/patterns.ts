import type { Track } from "../types";

// The Patterns track: the payoff. Real features — filtered lists, derived
// totals, undo, a todo form — each a few lines over state and streams. Every
// solution is verified by its check in the e2e run.

export const patterns: Track = {
  id: "patterns",
  title: "Patterns",
  blurb: "Real features in a few lines: filter, totals, undo, a todo form.",
  steps: [
    {
      id: "filter",
      title: "A filtered list",
      task: `A derived list is just \`.map\` over a state of an array. The filtered
result is a state too, so \`<Each>\` keeps the DOM in sync as you type.

**Goal:** show only the fruits that contain what's typed.`,
      starter: `import { state } from '@continuum-js/frp';
import { Each, bindInput } from '@continuum-js/dom';

const ALL = ['apple', 'apricot', 'banana', 'cherry'];

export default function App() {
  const query = state('');
  // const shown = query.map((q) => ALL.filter((x) => x.includes(q)));
  const shown = state(ALL);
  return (
    <div>
      <input {...bindInput(query, query.set)} />
      <ul>
        <Each each={shown} by={(x) => x}>
          {(x) => <li>{x}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { Each, bindInput } from '@continuum-js/dom';

const ALL = ['apple', 'apricot', 'banana', 'cherry'];

export default function App() {
  const query = state('');
  const shown = query.map((q) => ALL.filter((x) => x.includes(q)));
  return (
    <div>
      <input {...bindInput(query, query.set)} />
      <ul>
        <Each each={shown} by={(x) => x}>
          {(x) => <li>{x}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      hint: "const shown = query.map((q) => ALL.filter((x) => x.includes(q)));",
      check: ({ render, type, App }) => {
        const { container } = render(App);
        if (container.querySelectorAll("li").length !== 4) return false;
        type(container.querySelector("input")!, "ap");
        return container.querySelectorAll("li").length === 2;
      },
    },
    {
      id: "total",
      title: "A derived total",
      task: `Totals never get out of sync because they aren't stored — they're
**computed** from the source with \`.map\`. Change the source, the total
follows.

**Goal:** show the sum of the prices; **add $5** should update it.`,
      starter: `import { state } from '@continuum-js/frp';

export default function App() {
  const prices = state([2, 3]);
  // const total = prices.map((xs) => xs.reduce((a, b) => a + b, 0));
  const total = 0;
  return (
    <div>
      <button onClick={() => prices.update((xs) => [...xs, 5])}>add $5</button>
      <p>total: {total}</p>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';

export default function App() {
  const prices = state([2, 3]);
  const total = prices.map((xs) => xs.reduce((a, b) => a + b, 0));
  return (
    <div>
      <button onClick={() => prices.update((xs) => [...xs, 5])}>add $5</button>
      <p>total: {total}</p>
    </div>
  );
}`,
      hint: "prices.map((xs) => xs.reduce((a, b) => a + b, 0))",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        if (!/total:\s*5/.test(container.textContent!)) return false;
        click(container.querySelector("button")!);
        return /total:\s*10/.test(container.textContent!);
      },
    },
    {
      id: "undo",
      title: "Undo in a few lines",
      task: `Undo isn't a library — it's a different **fold**. Keep a history of past
values alongside the present; \`+1\` pushes the present onto the past, \`undo\`
pops it back. The reducers are the whole feature.

**Goal:** make **undo** restore the previous count.`,
      starter: `import { stream, state } from '@continuum-js/frp';

export default function App() {
  const inc = stream();
  const undo = stream();
  const hist = state({ past: [], present: 0 }).on(inc, (h) => ({
    past: [...h.past, h.present],
    present: h.present + 1,
  }));
  const count = hist.map((h) => h.present);
  return (
    <div>
      <button onClick={inc.fire}>+1</button>
      <button onClick={undo.fire}>undo</button>
      <p>{count}</p>
    </div>
  );
}`,
      solution: `import { stream, state } from '@continuum-js/frp';

export default function App() {
  const inc = stream();
  const undo = stream();
  const hist = state({ past: [], present: 0 })
    .on(inc, (h) => ({
      past: [...h.past, h.present],
      present: h.present + 1,
    }))
    .on(undo, (h) =>
      h.past.length
        ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1] }
        : h,
    );
  const count = hist.map((h) => h.present);
  return (
    <div>
      <button onClick={inc.fire}>+1</button>
      <button onClick={undo.fire}>undo</button>
      <p>{count}</p>
    </div>
  );
}`,
      hint: "Add .on(undo, h => h.past.length ? { past: h.past.slice(0,-1), present: h.past[h.past.length-1] } : h)",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const [inc, undo] = container.querySelectorAll("button");
        click(inc);
        click(inc);
        click(inc); // present = 3
        click(undo); // back to 2
        return container.querySelector("p")!.textContent!.trim() === "2";
      },
    },
    {
      id: "todo",
      title: "A todo form",
      task: `Everything together: a draft state, a submit stream, and the list folded
from submissions. \`.at(submit)\` captures the draft, \`.filter\` drops blanks,
\`.accum\` builds the list — and \`<Each>\` renders it.

**Goal:** typing text and pressing **add** should append a todo.`,
      starter: `import { stream, state } from '@continuum-js/frp';
import { Each, bindInput } from '@continuum-js/dom';

export default function App() {
  const draft = state('');
  const submit = stream();
  let id = 0;
  // build todos from submitted, non-empty drafts:
  const todos = state([]);
  const add = () => {
    submit.fire();
    draft.set('');
  };
  return (
    <div>
      <input {...bindInput(draft, draft.set)} />
      <button onClick={add}>add</button>
      <ul>
        <Each each={todos} by={(t) => t.id}>
          {(t) => <li>{t.text}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      solution: `import { stream, state } from '@continuum-js/frp';
import { Each, bindInput } from '@continuum-js/dom';

export default function App() {
  const draft = state('');
  const submit = stream();
  let id = 0;
  const todos = draft
    .at(submit)
    .filter((t) => t.trim().length > 0)
    .accum([], (text, list) => [...list, { id: ++id, text }]);
  const add = () => {
    submit.fire();
    draft.set('');
  };
  return (
    <div>
      <input {...bindInput(draft, draft.set)} />
      <button onClick={add}>add</button>
      <ul>
        <Each each={todos} by={(t) => t.id}>
          {(t) => <li>{t.text}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      hint: "todos = draft.at(submit).filter(t => t.trim()).accum([], (text, list) => [...list, { id: ++id, text }])",
      check: ({ render, type, click, App }) => {
        const { container } = render(App);
        type(container.querySelector("input")!, "buy milk");
        click(container.querySelector("button")!);
        const items = container.querySelectorAll("li");
        return items.length === 1 && /buy milk/.test(container.textContent!);
      },
    },
  ],
};
