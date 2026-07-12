# From RxJS — and the stream world at large

If you write RxJS, we have strange news for you: **you already think half
like us**. Operators, pipelines, "everything is a stream" — that reflex
stays fully useful here. The other half of the news is nicer: the three
things you've been fighting for years — `combineLatest` glitches, the
`Subject` zoo, and subscription leaks — need no fighting in Continuum.
They are impossible to write.

This page is long. Pour some tea: we'll unpack why Rx is built the way it
is, exactly where our roads fork, and what happens to every operator in
your muscle memory.

## A shared ancestry: half of an idea

In 1997, Conal Elliott and Paul Hudak described FRP: **two** types —
`Behavior` (a value across time) and `Stream` (discrete occurrences) — with
a precise mathematical semantics of composition.

In 2009, Erik Meijer's team at Microsoft shipped Reactive Extensions. Rx
took FRP's word "reactive" and its operator algebra over streams — and
deliberately dropped the other half: a separate type for _values_, and
transactional simultaneity. The result is a superb general-purpose async
streams library — but it is a _different thing_, with its own trade-offs.

Amusingly, Rx's JS descendants kept reinventing the dropped half, one
piece at a time:

| Library                          | What it brought back from FRP                                 |
| -------------------------------- | ------------------------------------------------------------- |
| **Bacon.js** (2012)              | `Property` — a stream with a current value: almost a Behavior |
| **Kefir** (2014)                 | `Property` again, plus a size diet                            |
| **xstream** (2016, for Cycle.js) | hot-only streams — a half-fix for hot/cold                    |
| **most.js**                      | speed and algebraic discipline                                |
| **RxJS**                         | `BehaviorSubject` + `shareReplay(1)` — a hand-rolled Behavior |

Continuum doesn't "reinvent" — it descends from the original line
(Fran → Sodium), where both halves of the idea are intact. Every
difference below follows from that.

## Difference #1: you have one type, we have two

In Rx everything is an `Observable` — even things that are by nature not
"a stream of happenings" but "a current value": the user's name, an
input's contents, a loading flag.

Cue the ceremony you know by heart:

```ts
// RxJS: a "current value" out of a stream — assemble it yourself
const count$ = clicks$.pipe(
  scan((n) => n + 1, 0),
  startWith(0), // don't forget the seed!
  shareReplay({ bufferSize: 1, refCount: true }), // don't forget replay!
);
// ...then pray nobody subscribes "too late", and that refCount doesn't
// wipe the state when subscribers blink.
```

Every link in that chain is a defense against the fact that a stream _has
no current value_. `startWith` fixes "subscribed before the first
emission", `shareReplay(1)` fixes "subscribed after the last one",
`refCount` fixes the leak `shareReplay` creates, and the bug "state reset
because everyone unsubscribed for a millisecond" isn't fixed by anything —
you just catch it in production.

In Continuum, "a current value" is its own type, `State` (the FRP literature
calls it a _Behavior_; previously named `Wire` here):

```ts
// Continuum
const count = clicks.accum(0, (_e, n) => n + 1);
```

That's all. `count` **always** has a value. You can't subscribe "too
late" — `listen` delivers the current value immediately, and `sample()`
always answers, listeners or not. You can't "reset the state by
unsubscribing" — the value lives in the State, not in a chain of
subscriptions. `startWith`, `shareReplay`, `refCount`, `BehaviorSubject`,
the hot/cold dilemma — those words aren't in our vocabulary because the
problems they solve don't exist.

The translation rule is simple:

> If your pipe ends in `scan`/`startWith`/`shareReplay`, or starts with a
> `BehaviorSubject` — it was never a stream. It was a State forced to
> impersonate one.

## Difference #2: glitches aren't your bug — they're Rx's model

The classic. One value, two branches, a join:

```ts
// RxJS
const doubled$ = src$.pipe(map((x) => x * 2));
const squared$ = src$.pipe(map((x) => x * x));
combineLatest([doubled$, squared$]).subscribe(([d, s]) => {
  console.log(d + s);
});

// src$ emits 2:  log: 8        (4 + 4)      ✓
// src$ emits 3:  log: 10 !!!   (6 + 4)      ← GLITCH: new doubled, old squared
//                log: 15       (6 + 9)      ✓
```

`combineLatest` fires on _every_ input update — and at the instant when
`doubled$` has seen the three but `squared$` hasn't, it emits a state of
the world **that never existed**. If a server request hangs off that sum,
you just sent garbage.

Rx veterans know the incantations: `debounceTime(0)`, `auditTime(0)`,
reorder into `withLatestFrom`, "just don't build diamonds". That is
discipline — i.e. the thing a junior forgets on a Friday evening.

In Continuum, the diamond is a legal, encouraged topology:

```ts
// Continuum
const doubled = src.map((x) => x * 2);
const squared = src.map((x) => x * x);
const sum = combine(doubled, squared, (d, s) => d + s);

// src: 2 → 3.  sum: 8 → 15. One step. The intermediate "10" does not exist.
```

Every update is a **transaction**: an atomic moment inside which nodes
recompute in graph-depth order (sources → deriveds → deriveds of
deriveds). A join physically cannot fire before both of its inputs have
settled. That's not an optimization, not batching — it is the definition
of "simultaneous".

Same for merging: Rx's `merge` hands you simultaneous inputs "in some
order". Our simultaneity is honest, and the API makes you say what it
means:

```ts
// Continuum: two events in one moment — say how they combine
const delta = Stream.merge(plus, minus, (a, b) => a + b);
```

## Difference #3: subscriptions nobody has to babysit

Open any Rx codebase and you'll meet one of these patterns:

```ts
// Pattern 1: manual bookkeeping
private subs = new Subscription();
ngOnInit() { this.subs.add(a$.subscribe(...)); this.subs.add(b$.subscribe(...)); }
ngOnDestroy() { this.subs.unsubscribe(); }

// Pattern 2: the takeUntil cross
private destroy$ = new Subject<void>();
a$.pipe(takeUntil(this.destroy$)).subscribe(...);
ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
```

Angular invented the `async` pipe to hide this bookkeeping; the community
invented a dozen lint rules to police it. Because a forgotten unsubscribe
is the #1 bug of any Rx codebase: silent, compounding, surfacing a month
later as "why does the app eat memory and run handlers of dead screens".

In Continuum, subscriptions register in the **ownership tree**. Whatever a
component sets up — bindings, regions, timers — is recorded against its
subtree. When the subtree goes (route switched, `Show` flipped),
everything inside unsubscribes in a cascade. Not "must remember" —
"cannot forget":

```tsx
function Ticker() {
  const seconds = interval(1000).hold(0);
  return <span>{seconds}</span>;
  // unmounted — the timer stops, the binding unsubscribes. Done.
}
```

The only place an unsubscribe is visible at all is the explicit low-level
`listen`, and there it is one line: `onCleanup(e.listen(handler))`.

## The operator dictionary

Your reflexes port almost verbatim:

| RxJS                              | Continuum                      | Note                                 |
| --------------------------------- | ------------------------------ | ------------------------------------ |
| `map`, `filter`                   | `e.map`, `e.filter`            | same                                 |
| `scan(f, init)`                   | `e.accum(init, f)`             | result is a State already            |
| `startWith(x)` + `shareReplay(1)` | `e.hold(x)`                    | one word for the whole ceremony      |
| `combineLatest`                   | `combine(a, b, f)`             | glitch-free                          |
| `withLatestFrom(b$)`              | `b.at(e, f)`                   | with exact simultaneity              |
| `merge(a$, b$)`                   | `Stream.merge(a, b, f)`        | simultaneous inputs coalesce via `f` |
| `race(a$, b$)`-ish                | `a.or(b)`                      | left-biased                          |
| `debounceTime(ms)`                | `debounce(e, ms)`              | std                                  |
| `throttleTime(ms)`                | `throttle(e, ms)`              | std                                  |
| `delay(ms)`                       | `delay(e, ms)`                 | std                                  |
| `interval(ms)`                    | `interval(ms)`                 | std; a `Stream<number>`              |
| `distinctUntilChanged()`          | `distinct(e)` / `distinctB(b)` | std                                  |
| `pairwise()`                      | `pairwise(e)`                  | std                                  |
| `take(1)` / `first()`             | `e.once()`                     |                                      |
| `filter(() => flag)`              | `e.when(flag)`                 | the flag is a State, not a closure   |
| `BehaviorSubject`                 | `state(init)`                  | a _type_, not a workaround           |
| `Subject`                         | `stream()`                     |                                      |
| `switchMap(fetch)`                | `resource(e, fetch)`           | see below                            |
| `subscribe`                       | `listen` + `onCleanup`         | or just a JSX binding                |

## `switchMap` and async: our answer is data

Half of real-world RxJS is "a stream of requests → `switchMap` → a stream
of responses" with stale-request cancellation:

```ts
// RxJS
query$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((q) =>
    this.http.get(`/search?q=${q}`).pipe(
      map((r) => ({ loading: false, data: r })),
      startWith({ loading: true, data: null }),
      catchError((e) => of({ loading: false, error: e })),
    ),
  ),
);
```

Familiar? Three states smeared across `startWith`/`catchError`,
cancellation hidden inside `switchMap`'s semantics — and heaven help you
if you reach for `mergeMap` instead: a response race you won't notice for
a while.

Continuum folds the whole pattern into one function with an honest type:

```ts
// Continuum
const settled = debounce(query.updates, 300);
const results = resource(settled, (q) => api.search(q));
// State<Async<T>>: { status: "idle" | "loading" | "ok" | "error" }
```

`resource` _is_ "switchMap for UIs": last request wins (stale responses
are ignored by sequence number, not by fragile cancellation),
loading/error are branches of a _value_ you render with a plain `Dynamic`.
An error is not an exception racing down the pipe and killing the stream
(remember the surprise that an errored Observable is dead forever?) — it
is data.

For non-standard cases there's the lower-level `perform`:

```ts
const answers = perform(requests, (r) => api.send(r));
// Stream<Result<unknown, T>> — { ok: true, value } | { ok: false, error }
```

An honest admission: `concatMap` and `exhaustMap` (queue the requests;
ignore while one is in flight) have no ready-made counterparts — both are
expressible with `when`/`accum`, but you'll have to think. If your problem
_is_ orchestrating queues of async operations, RxJS is stronger there.

## What we don't have — and why that's good

- **Hot vs cold.** Our Streams are always hot and multicast. There is no
  "each subscriber gets its own fetch"; no `share` needed.
- **Complete/error as terminal signals.** Our streams don't _die_ —
  neither on their own after an error, nor via `complete`. Errors are
  data; end-of-life is the owner subtree being disposed.
- **Backpressure.** We're a UI library: events don't arrive faster than
  frames render. If you need real backpressure, you don't need a UI
  framework.
- **A hundred and fifty operators.** `bufferToggle`, `windowWhen`,
  `sequenceEqual`… Our std fits in 2 kB. The exotic ones are ordinary
  functions over `Stream` — often three lines, and they're yours.
- **Schedulers.** Transactional logical time plus the browser's
  `queueMicrotask` cover our scenarios.

## Where RxJS remains the better choice

Symmetric honesty. Pick Rx, not us, when you have:

- **non-UI pipelines**: data processing, sockets with queues, server-side
  orchestration;
- **complex time choreography**: windows, buffers, zipping multiple
  streams with alignment;
- **operation queues** (`concatMap`/`exhaustMap` scenarios) as the heart
  of the problem;
- infrastructure already standing on Rx (Angular, NestJS microservices).

Continuum is not "a better RxJS". It is a UI framework in which the event
algebra is one half of the model — not the whole model.

## The one-line summary

> **Like RxJS — but with real values, no glitches, and automatic
> unsubscription. And the network is wired straight into the DOM.**

Where to go next:

- [What is FRP — in plain words](/frp-in-plain-words) — the model from
  scratch;
- [Streams](/concepts/events) and [States](/concepts/behaviors) — both
  halves, precisely;
- [Transactions and time](/concepts/transactions) — how "glitch-free"
  actually works;
- [History and context](/history) — where both Rx and we come from.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
