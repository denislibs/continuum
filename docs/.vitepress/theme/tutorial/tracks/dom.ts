import type { Track } from "../types";

// The DOM track: composing components, binding attributes, and the built-in
// control-flow components. Each solution is verified by its check in the e2e
// run; each starter fails it.

export const dom: Track = {
  id: "dom",
  title: "DOM & components",
  blurb: "Components, attribute bindings, Show, Each, Dynamic, context.",
  steps: [
    {
      id: "components",
      title: "Compose components",
      task: `A component is a function returning JSX. It runs **once**; you nest
components like any other element, passing data through props.

**Goal:** extract a \`Greeting\` component and render it for Ada and Bob.`,
      starter: `export default function App() {
  return (
    <div>
      {/* render <Greeting name="Ada" /> and <Greeting name="Bob" /> */}
    </div>
  );
}

function Greeting(props) {
  return <p class="greet">Hi {props.name}!</p>;
}`,
      solution: `export default function App() {
  return (
    <div>
      <Greeting name="Ada" />
      <Greeting name="Bob" />
    </div>
  );
}

function Greeting(props) {
  return <p class="greet">Hi {props.name}!</p>;
}`,
      hint: 'Use it like a tag: <Greeting name="Ada" />',
      check: ({ render, App }) => {
        const { container } = render(App);
        const greets = container.querySelectorAll(".greet");
        return greets.length === 2 && /Hi Ada!/.test(container.textContent!);
      },
    },
    {
      id: "class",
      title: "Bind an attribute",
      task: `Any attribute can take a **derived state**. Put a \`State\` in \`class={…}\`
and only that attribute updates when it changes — no re-render.

**Goal:** the button's class should be \`"on"\` when active, \`"off"\` otherwise.`,
      starter: `import { state } from '@continuum-js/frp';

export default function App() {
  const active = state(false);
  return (
    <button
      class={'off'}
      onClick={() => active.update((a) => !a)}
    >
      toggle
    </button>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';

export default function App() {
  const active = state(false);
  return (
    <button
      class={active.map((a) => (a ? 'on' : 'off'))}
      onClick={() => active.update((a) => !a)}
    >
      toggle
    </button>
  );
}`,
      hint: "class={active.map((a) => (a ? 'on' : 'off'))}",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        if (btn.className !== "off") return false;
        click(btn);
        return btn.className === "on";
      },
    },
    {
      id: "show",
      title: "Show — and pass the value",
      task: `\`<Show when={s}>\` mounts its children only when \`s\` is truthy, with an
optional \`fallback\`. The children receive the **non-null value**, so you can
use it directly.

**Goal:** greet the logged-in user by name; show "logged out" otherwise.`,
      starter: `import { state } from '@continuum-js/frp';
import { Show } from '@continuum-js/dom';

export default function App() {
  const user = state(null);
  return (
    <div>
      <button onClick={() => user.set({ name: 'Ada' })}>log in</button>
      <Show when={user} fallback={() => <p>logged out</p>}>
        {(u) => <p>hello</p>}
      </Show>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { Show } from '@continuum-js/dom';

export default function App() {
  const user = state(null);
  return (
    <div>
      <button onClick={() => user.set({ name: 'Ada' })}>log in</button>
      <Show when={user} fallback={() => <p>logged out</p>}>
        {(u) => <p>hello {u.name}</p>}
      </Show>
    </div>
  );
}`,
      hint: "The child gets the value: {(u) => <p>hello {u.name}</p>}",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        if (!/logged out/.test(container.textContent!)) return false;
        click(container.querySelector("button")!);
        return /hello Ada/.test(container.textContent!);
      },
    },
    {
      id: "each",
      title: "A growing list",
      task: `\`<Each>\` keeps a keyed list in sync with a state of arrays. Push to the
array and it inserts exactly one row — the existing ones are untouched.

**Goal:** the **add** button should append an item.`,
      starter: `import { state } from '@continuum-js/frp';
import { Each } from '@continuum-js/dom';

export default function App() {
  const items = state(['one']);
  let n = 1;
  const add = () => {
    // append 'item N' to items
  };
  return (
    <div>
      <button onClick={add}>add</button>
      <ul>
        <Each each={items} by={(x) => x}>
          {(x) => <li>{x}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { Each } from '@continuum-js/dom';

export default function App() {
  const items = state(['one']);
  let n = 1;
  const add = () => {
    items.update((list) => [...list, 'item ' + ++n]);
  };
  return (
    <div>
      <button onClick={add}>add</button>
      <ul>
        <Each each={items} by={(x) => x}>
          {(x) => <li>{x}</li>}
        </Each>
      </ul>
    </div>
  );
}`,
      hint: "items.update((list) => [...list, 'item ' + ++n])",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        click(btn);
        click(btn);
        return container.querySelectorAll("li").length === 3;
      },
    },
    {
      id: "dynamic",
      title: "Switch the subtree",
      task: `\`<Dynamic value={s}>\` rebuilds its children whenever \`s\` changes — for
when a whole region depends on a mode or route, not just a value.

**Goal:** show "Panel A" or "Panel B" depending on the current tab.`,
      starter: `import { state } from '@continuum-js/frp';
import { Dynamic } from '@continuum-js/dom';

export default function App() {
  const tab = state('a');
  return (
    <div>
      <button onClick={() => tab.set('b')}>go B</button>
      <Dynamic value={tab}>
        {(t) => <p>Panel A</p>}
      </Dynamic>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { Dynamic } from '@continuum-js/dom';

export default function App() {
  const tab = state('a');
  return (
    <div>
      <button onClick={() => tab.set('b')}>go B</button>
      <Dynamic value={tab}>
        {(t) => (t === 'a' ? <p>Panel A</p> : <p>Panel B</p>)}
      </Dynamic>
    </div>
  );
}`,
      hint: "{(t) => (t === 'a' ? <p>Panel A</p> : <p>Panel B</p>)}",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        if (!/Panel A/.test(container.textContent!)) return false;
        click(container.querySelector("button")!);
        return /Panel B/.test(container.textContent!);
      },
    },
    {
      id: "context",
      title: "Context",
      task: `Context passes a value down the tree without prop-drilling. Create it with
\`createContext(default)\`, set it with \`provide(ctx, value)\`, read it in any
descendant with \`use(ctx)\`.

**Goal:** provide the theme \`"dark"\` so the child reads it.`,
      starter: `import { createContext, provide, use } from '@continuum-js/dom';

const Theme = createContext('light');

export default function App() {
  // provide 'dark' here
  return <Child />;
}

function Child() {
  return <p>theme: {use(Theme)}</p>;
}`,
      solution: `import { createContext, provide, use } from '@continuum-js/dom';

const Theme = createContext('light');

export default function App() {
  provide(Theme, 'dark');
  return <Child />;
}

function Child() {
  return <p>theme: {use(Theme)}</p>;
}`,
      hint: "provide(Theme, 'dark'); before returning <Child />",
      check: ({ render, App }) => {
        const { container } = render(App);
        return /theme:\s*dark/.test(container.textContent!);
      },
    },
  ],
};
