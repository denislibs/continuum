# The compiler (optional)

Continuum works without any build plugin: JSX goes through the standard
esbuild transform and the runtime factory builds the DOM. That stays the
default — any vite/esbuild setup, zero configuration.

`@continuum-js/vite-plugin` is an **optional accelerator** for create-heavy
screens (long lists, big tables). It compiles the exact same JSX you already
write into cloned templates: all static markup is glued into one HTML string
parsed once per call site, so creating a subtree becomes a single
`cloneNode(true)` plus bindings for the dynamic holes — the technique behind
Solid's numbers.

::: tip "Optional" means removable, not rarely used
The plugin is **on by default**: `npm create continuum-js` puts it in your
`vite.config.ts`, so every new project ships with it. "Optional" is about
correctness, not adoption — delete the plugin line and the _same_ code runs
unchanged through the runtime factory; you only give up some create-time speed
on heavy screens. It's a default-on accelerator, not a dependency you have to
manage.
:::

Projects scaffolded with `npm create continuum-js@latest` get the plugin
**out of the box** — nothing to do. To add it to an existing app:

```bash
npm i -D @continuum-js/vite-plugin
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import continuum from "@continuum-js/vite-plugin";

export default defineConfig({
  plugins: [continuum()],
});
```

That's the whole migration: **no code changes**. Semantics are identical —
the compiled output binds states, events and children through the very same
internals as the runtime factory (our CI runs the full dom test suite both
ways). Whatever the compiler is not statically sure about — spreads on
elements, dynamic tag names, SVG — is simply left to the runtime factory,
so correctness never depends on the compiler being smart.

## See it compile

Edit the component below, then open the **Compiled** tab — that panel runs the
real plugin transform. Notice how the static markup collapses into one template
cloned per instance, with only `{likes}` left as a dynamic hole:

<script setup>
const compilerDemo = `import { state } from '@continuum-js/frp';

export default function Card() {
  const likes = state(0);
  return (
    <article class="card">
      <h3>Continuum</h3>
      <p>Reactive UI without re-renders.</p>
      <button onClick={() => likes.update((n) => n + 1)}>
        ♥ {likes}
      </button>
    </article>
  );
}`;
</script>

<ClientOnly>
  <Playground height="340px" :code="compilerDemo" />
</ClientOnly>

What it buys (js-framework-benchmark table, script time, same machine):
creating 1k rows ~1.5× faster, appending 1k ~1.6× faster, creating 10k
~1.5× faster; update operations were already fine without it.

When to remove it: never required — deleting the plugin line keeps the
exact same app running through the runtime factory (useful for esbuild-only
setups or when debugging generated output).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
