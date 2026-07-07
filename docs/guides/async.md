# Async

The FRP network is pure and synchronous: the moment closes, effects run
after it. The asynchronous world enters and leaves through two hatches.

## `perform`: IO as data

`perform` turns an event of requests into an event of results. The promise
runs _after_ the moment closes; its result opens a **new** moment. An error
is not an exception but a `Result` branch:

```ts
import { perform, type Result } from "@continuum-js/frp";

const results = perform(saveClicks, (draft) => api.save(draft));
// Event<Result<unknown, SaveResponse>>

const saved = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);
```

Both branches are ordinary events: `merge` them, fold them with `accum`,
show them via `hold`.

## `resource`: a loading state machine

For the typical "load on trigger and show" there is `resource` from
`@continuum-js/std`:

```tsx
import { resource } from "@continuum-js/std";
import { Dynamic } from "@continuum-js/dom";

const state = resource(userId.updates, (id) => api.fetchUser(id));
// Behavior<Async<User>>: { status: "idle" | "loading" | "ok" | "error" }

<Dynamic value={state}>
  {(s) =>
    s.status === "loading" ? (
      <Spinner />
    ) : s.status === "error" ? (
      <ErrorBox error={s.error} />
    ) : s.status === "ok" ? (
      <Profile user={s.value} />
    ) : null
  }
</Dynamic>;
```

The key part: **the response race is solved inside**. Requests are stamped
with sequence numbers; a response to a superseded request is ignored
(last-request-wins). The classic "a slow response to an old request
overwrote the fresh one" bug is unreproducible by construction — in React
that is a manual `cancelled` flag in every `useEffect`.

## Debounced search: composition instead of a hook

Event combinators and `resource` snap together:

```ts
import { debounce } from "@continuum-js/std";

const settled = debounce(query.updates, 300); // Event<string>
const results = resource(settled, (q) => api.search(q));
```

No custom hook, no timers in the component: `debounce` is a pure operator
over an event, `resource` is a state machine over the results.

## Timers

`interval(ms)` from std is an event of ticks; `delay(e, ms)` shifts an event
in time. Their timers stop when the event is `dispose()`d — in a component,
tie that to the ownership tree explicitly:

```ts
import { interval } from "@continuum-js/std";
import { onCleanup } from "@continuum-js/dom";

const ticks = interval(1000);
onCleanup(() => ticks.dispose());
```

For animation there is `animationFrames()` from dom — it registers with the
owner by itself — and continuous time (`integral`/`warp`) in the core; see
the [animation guide](/guides/animation).

## The one-direction rule

Async code never "writes state back" on its own — it always produces an
_event_, which the network folds with the usual tools (`hold`, `accum`,
`resource`). If you feel like calling `set` inside `.then()`, that is
probably a `perform` in disguise.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
