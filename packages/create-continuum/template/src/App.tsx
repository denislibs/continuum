import { wire } from "@continuum-js/frp";

// A Continuum component runs ONCE — there are no re-renders. `count` is a
// reactive value: putting it in JSX binds a text node to it, and clicking
// patches exactly that node.
export function App() {
  const count = wire(0);

  return (
    <main>
      <h1>Continuum</h1>
      <button onClick={() => count.update((n) => n + 1)}>count: {count}</button>
      <p>
        Edit <code>src/App.tsx</code> to get started.
      </p>
    </main>
  );
}
