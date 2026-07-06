import { newEvent } from "@continuum-js/frp";

// A Continuum component runs ONCE. The click event flows into the FRP
// network, `accum` folds it into a behavior, and exactly one text node is
// patched on change — no re-renders, no virtual DOM.
export function App() {
  const [clicks, fire] = newEvent<MouseEvent>();
  const count = clicks.accum(0, (_e, n) => n + 1);

  return (
    <main>
      <h1>Continuum</h1>
      <button onClick={fire}>count: {count}</button>
      <p>
        Edit <code>src/App.tsx</code> to get started.
      </p>
    </main>
  );
}
