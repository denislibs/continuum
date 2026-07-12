import type { Track } from "../types";

// The Async track: talking to the outside world without losing the plot.
// `perform` is the IO boundary — an effect runs after the moment closes and
// its result re-enters the graph as data. `resource` folds that into a
// lifecycle behavior (idle → loading → ok | error), with stale responses
// dropped by construction. Every solution is verified by its check in the e2e
// run; checks await `flush()` to drain the settled promises.

export const asyncTrack: Track = {
  id: "async",
  title: "Async",
  blurb: "Talk to the network as values: perform, resource, races solved.",
  steps: [
    {
      id: "perform",
      title: "The IO boundary",
      task: `A promise isn't a value that happens — \`perform(stream, fn)\` makes it one.
When the stream fires, \`fn\` runs **after** the moment closes; its result comes
back as a stream of \`{ ok, value }\` / \`{ ok, error }\`. No effects mid-moment,
no thrown rejections — failure is just data.

**Goal:** load a message on click and show it (start with \`idle\`).`,
      starter: `import { stream, perform } from '@continuum-js/frp';

export default function App() {
  const load = stream();
  // const result = perform(load, async () => 'hello from server');
  // const text = result.map((r) => (r.ok ? r.value : 'failed')).hold('idle');
  const text = 'idle';
  return (
    <div>
      <button onClick={load.fire}>load</button>
      <p>{text}</p>
    </div>
  );
}`,
      solution: `import { stream, perform } from '@continuum-js/frp';

export default function App() {
  const load = stream();
  const result = perform(load, async () => 'hello from server');
  const text = result.map((r) => (r.ok ? r.value : 'failed')).hold('idle');
  return (
    <div>
      <button onClick={load.fire}>load</button>
      <p>{text}</p>
    </div>
  );
}`,
      hint: "perform(load, async () => 'hello from server') → a stream of Results; map r.ok ? r.value : 'failed', then hold('idle').",
      check: async ({ render, click, flush, App }) => {
        const { container } = render(App);
        if (!/idle/.test(container.textContent!)) return false;
        click(container.querySelector("button")!);
        await flush();
        return /hello from server/.test(container.textContent!);
      },
    },
    {
      id: "resource",
      title: "A request as a lifecycle",
      task: `\`resource(trigger, fetcher)\` folds a stream of requests into one **state**
that walks \`idle → loading → ok\`. You render straight off its \`status\` — no
\`isLoading\` flags to keep in sync, because the flag *is* the value.

**Goal:** on **load**, show \`loading…\` and then the result.`,
      starter: `import { stream } from '@continuum-js/frp';
import { resource } from '@continuum-js/std';

export default function App() {
  const load = stream();
  // const data = resource(load, async () => 'sunny');
  const data = resource(load, async () => 'sunny');
  // map the Async status to what to show:
  const label = data.map((s) => s.status);
  return (
    <div>
      <button onClick={load.fire}>load</button>
      <p>{label}</p>
    </div>
  );
}`,
      solution: `import { stream } from '@continuum-js/frp';
import { resource } from '@continuum-js/std';

export default function App() {
  const load = stream();
  const data = resource(load, async () => 'sunny');
  const label = data.map((s) =>
    s.status === 'loading'
      ? 'loading…'
      : s.status === 'ok'
        ? s.value
        : 'idle',
  );
  return (
    <div>
      <button onClick={load.fire}>load</button>
      <p>{label}</p>
    </div>
  );
}`,
      hint: "label = data.map(s => s.status === 'loading' ? 'loading…' : s.status === 'ok' ? s.value : 'idle')",
      check: async ({ render, click, flush, App }) => {
        const { container } = render(App);
        click(container.querySelector("button")!);
        // loading is synchronous with the click; the value arrives after flush
        if (!/loading/.test(container.textContent!)) return false;
        await flush();
        return /sunny/.test(container.textContent!);
      },
    },
    {
      id: "error",
      title: "Failure is a branch, not a throw",
      task: `A rejected fetch doesn't blow up your component — \`resource\` catches it and
moves to \`status: 'error'\` with the reason attached. You handle it the same way
you handle any other value: another branch.

**Goal:** show \`error: <message>\` when the fetch fails.`,
      starter: `import { stream } from '@continuum-js/frp';
import { resource } from '@continuum-js/std';

export default function App() {
  const load = stream();
  const data = resource(load, async () => {
    throw new Error('server is down');
  });
  // handle the 'error' branch too:
  const label = data.map((s) => (s.status === 'ok' ? s.value : s.status));
  return (
    <div>
      <button onClick={load.fire}>load</button>
      <p>{label}</p>
    </div>
  );
}`,
      solution: `import { stream } from '@continuum-js/frp';
import { resource } from '@continuum-js/std';

export default function App() {
  const load = stream();
  const data = resource(load, async () => {
    throw new Error('server is down');
  });
  const label = data.map((s) =>
    s.status === 'ok'
      ? s.value
      : s.status === 'error'
        ? 'error: ' + s.error.message
        : s.status,
  );
  return (
    <div>
      <button onClick={load.fire}>load</button>
      <p>{label}</p>
    </div>
  );
}`,
      hint: "In the map, add: s.status === 'error' ? 'error: ' + s.error.message : s.status",
      check: async ({ render, click, flush, App }) => {
        const { container } = render(App);
        click(container.querySelector("button")!);
        await flush();
        return /error:\s*server is down/.test(container.textContent!);
      },
    },
    {
      id: "search",
      title: "Search without the race",
      task: `Type-ahead is where async bites: a slow response to \`"ab"\` can land *after*
\`"abc"\` and overwrite it. \`resource\` stamps every request and drops stale
answers — **last request wins**, for free. (In production you'd also feed it
\`debounce(query.updates, 300)\`; same code, fewer calls.)

**Goal:** show the fruits matching what's typed.`,
      starter: `import { state } from '@continuum-js/frp';
import { resource } from '@continuum-js/std';
import { Each, bindInput } from '@continuum-js/dom';

const FRUITS = ['apple', 'apricot', 'banana', 'cherry'];

export default function App() {
  const query = state('');
  // resource over the stream of edits — query.updates:
  // const found = resource(query.updates, async (q) => FRUITS.filter((f) => f.includes(q)));
  const found = resource(query.updates, async () => []);
  const list = found.map((s) => (s.status === 'ok' ? s.value : []));
  return (
    <div>
      <input {...bindInput(query)} />
      <ul>
        <Each each={list} by={(x) => x}>
          {(x) => <li>{x}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { resource } from '@continuum-js/std';
import { Each, bindInput } from '@continuum-js/dom';

const FRUITS = ['apple', 'apricot', 'banana', 'cherry'];

export default function App() {
  const query = state('');
  const found = resource(query.updates, async (q) =>
    FRUITS.filter((f) => f.includes(q)),
  );
  const list = found.map((s) => (s.status === 'ok' ? s.value : []));
  return (
    <div>
      <input {...bindInput(query)} />
      <ul>
        <Each each={list} by={(x) => x}>
          {(x) => <li>{x}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      hint: "found = resource(query.updates, async (q) => FRUITS.filter((f) => f.includes(q)))",
      check: async ({ render, type, flush, App }) => {
        const { container } = render(App);
        type(container.querySelector("input")!, "ap");
        await flush();
        return container.querySelectorAll("li").length === 2; // apple, apricot
      },
    },
  ],
};
