# Reactive programming: history and context

This page is about where the idea underneath Continuum comes from: what
problem it solves, who articulated it and when, how it branched into several
traditions, and why we picked the oldest and strictest one.

## The problem: interactive systems break execution order

An ordinary program is a recipe: step by step, top to bottom, input to
output. It has a beginning and an end, and its execution order matches the
order of the text.

An interactive system is different: it **does not terminate**. It sits and
waits — for a click, a key, a network response, a timer tick — and must
react to events arriving _in any order, at any moment_. David Harel and Amir
Pnueli named such systems **reactive** in 1985, opposing them to
_transformational_ ones (input → computation → output), and observed that
classical ways of describing programs fit reactive systems poorly.

The default engineering answer is **callbacks**: "when X happens, do Y". It
works, but at scale it produces what Blackheath and Jones's FRP book calls
the six plagues of event handlers:

1. **unpredictable order** — which listener fires first;
2. **missed first event** — you subscribed later than it happened;
3. **messy state** — a callback caught the variables half-updated;
4. **threading of updates** — a cascade of "handler triggers handler" that
   cannot be traced;
5. **leaking listeners** — forgotten unsubscribes;
6. **accidental recursion** — a handler indirectly invokes itself.

Every plague is a symptom of the same disease: state is smeared across
variables, and its consistency is maintained _by hand_, by code inside
callbacks. Reactive programming is a family of attempts to shift consistency
onto the language or library: **you declare the dependencies, the system
keeps them true over time**.

## Prehistory: dataflow and spreadsheets

The idea that "a program is a dependency graph, not a list of steps" is
decades older than the term "reactive programming".

- **Dataflow languages.** Lucid (Ashcroft & Wadge, 1976) treated a variable
  not as a cell but as an _infinite sequence of values over time_ — in
  essence, a proto-Behavior.
- **Spreadsheets.** VisiCalc (Bricklin & Frankston, 1979), then Lotus 1-2-3
  and Excel — the first _mass-market_ reactive programming: the formula
  `=A1+B1` is a declared dependency the system maintains by itself. Millions
  of people programmed reactively without knowing the word.
- **Synchronous languages.** The French school of the 1980s — Esterel
  (Gérard Berry), Lustre (Caspi & Halbwachs, 1987), Signal — was built for
  on-board systems (Airbus avionics, power plants). Its key idea is the
  **synchronous hypothesis**: a reaction to an event is conceptually
  instantaneous and atomic, time is discrete, and "simultaneous" is a
  precisely defined notion. If that sounds like our transactions — it is:
  a Continuum transaction is a direct descendant of this idea.
- **Observer and MVC.** In the OO world the same need produced the Observer
  pattern (Smalltalk MVC, late 1970s; canonized by the GoF book in 1994).
  That is callbacks disciplined by an interface — but all six plagues
  survive it: _Deprecating the Observer Pattern_ (Maier, Rompf, Odersky, 2010) takes them apart one by one.

## 1997: FRP — Conal Elliott and Paul Hudak

**Functional Reactive Programming** was born as the paper _Functional
Reactive Animation_ (Conal Elliott, Paul Hudak; ICFP 1997) and the Haskell
library **Fran**, built to describe animations.

Fran's contribution was not "another event library" but a **denotational
semantics**: a precise mathematical meaning for every construct.

- **`Behavior a`** — a value at every moment: a function `Time → a`. And
  Elliott's time is _continuous_, like in physics — an animation is an
  equation, not a frame loop.
- **`Stream a`** — a set of moments with values: `[(Time, a)]`.

Composition acquires the character of algebra: `map`, `merge`, `switch`,
`snapshot` are defined by equations, not by describing an implementation.
Provable properties follow — notably glitch-freedom: half-updated state
_does not exist in the model_, rather than being "rarely observed".

Elliott still insists FRP means exactly two things: denotational semantics
plus continuous time. Everything else is "reactive programming" without the
"functional".

## The 2000s: growth in Haskell and the first browser experiments

Pure Fran had practical problems (time/space leaks under a naive
implementation), and the following decade searched for workable
formulations:

- **Yampa** (Nilsson, Courtney, Peterson, ~2002) — arrowized FRP: instead of
  first-class signals, signal _functions_ (`SF a b`), which closed the leaks
  at the cost of a less direct style. Robots and games were written in it.
- **FrTime** (Racket, ~2003) and **Flapjax** (2009, Krishnamurthi's group at
  Brown) — the first serious attempts to bring FRP to the browser; Flapjax
  was a language layered over JavaScript.
- **Push-pull FRP** (Elliott, 2009) — an implementation refinement: events
  _push_, behaviors _pull_; exactly this hybrid scheme lives in Continuum.
- **reactive-banana** (Apfelmus, ~2011) and **Sodium** (Stephen Blackheath,
  ~2012) — mature libraries of _discrete_ ("classic") FRP: time is not
  continuous but a sequence of transactions; the semantics stays strict, the
  implementation practical, and the library portable across languages
  (Java, C#, TypeScript…). The book **Functional Reactive Programming** by
  Blackheath and Jones (Manning, 2016) is the textbook of this branch and
  the main source of Continuum's model.

## 2009–2013: "reactive" goes mainstream

In parallel with the academic line, the term acquired two new — and
different — meanings.

**Rx / ReactiveX.** Erik Meijer's team at Microsoft shipped Reactive
Extensions (Rx.NET, 2009): `IObservable<T>` as the dual of
`IEnumerable<T>`, with a rich operator algebra over _event streams_. RxJS
brought it to JavaScript; ReactiveX to nearly every language. Rx is a
brilliant async-streams library, but it is **not** FRP in Elliott's sense:
there is no Behavior as a separate notion and no transactional
simultaneity — diamond glitches are possible and are a well-known trap
(`combineLatest` with a shared ancestor).

**The Reactive Manifesto** (2013, Jonas Bonér et al.) — a third meaning:
an architecture of _distributed systems_ (responsive, resilient, elastic,
message-driven). It has almost nothing to do with UI programming; we mention
it so search results don't confuse you.

## The 2010s: reactivity reaches UI frameworks

- **Knockout** (2010) — `observable` and `computed` with automatic
  dependency tracking in the browser; the direct ancestor of today's
  signals.
- **Elm** (Evan Czaplicki, 2012 thesis) — "concurrent FRP" for GUIs;
  tellingly, in 2016 (_A Farewell to FRP_, Elm 0.17) Elm _abandoned_ signals
  in favor of The Elm Architecture — the reducer loop that later inspired
  Redux.
- **React** (Facebook, 2013) — "reactive" in spirit, but the model is the
  opposite of FRP: state changes → the component _re-runs_ → the virtual
  DOM is diffed. Reactivity is achieved by recomputing everything and
  comparing, not by propagation through a dependency graph.
- **MobX** (Weststrate, 2015) and **Vue's** reactivity — "transparent"
  reactivity: reading a value inside a computation automatically creates a
  dependency (via proxies/getters). Convenient; the price is an implicit,
  dynamic dependency graph that is hard to reason about.
- **Svelte 3** (2019) — reactivity by compiler.
- **SolidJS** (Ryan Carniato; 1.0 in 2021) — fine-grained **signals** with
  no virtual DOM: a component runs once, point bindings update. Solid proved
  the run-once model to the industry — and started the signal wave: Preact
  Signals (2022), Angular Signals (2023), and the **TC39 Signals** proposal
  to standardize them in JavaScript itself (stage 1, 2024).

## Two living traditions — and where Continuum stands

By the 2020s, two main traditions of UI reactivity remain:

|              | Signals (Solid, Vue, Angular…) | Classic FRP (Sodium, Continuum)                         |
| ------------ | ------------------------------ | ------------------------------------------------------- |
| Dependencies | auto-tracked on read           | the expression structure (`map`/`lift`)                 |
| Graph        | implicit, dynamic              | explicit, static by construction                        |
| Simultaneity | batching as an optimization    | transactions as _semantics_                             |
| Streams      | no separate notion (effects)   | `Stream` is a first-class value                         |
| Time         | "the current value"            | a value _over time_; past and present distinct (`hold`) |
| Lineage      | Knockout → MobX → Solid        | Fran → Sodium → here                                    |

Continuum deliberately picks the second: **Behaviors + Streams +
transactions** from discrete FRP (Sodium), **run-once components and a
fine-grained DOM** whose practicality Solid proved, and an **ownership
tree** for lifecycle. Elliott's continuous time is here too —
`integral`/`warp` for animation, with `animationFrames()` as the sampling
clock.

The bet is simple: auto-tracking is more convenient to _write_, but an
explicit algebra is easier to _read and prove things about_ — and when
simultaneity is semantics, whole classes of bugs (glitches, read races,
"events from the past") need no discipline to avoid. They are not
expressible.

## Further reading

- Conal Elliott, Paul Hudak — _Functional Reactive Animation_ (ICFP 1997) —
  the primary source.
- Conal Elliott — _Push-Pull Functional Reactive Programming_ (2009).
- Stephen Blackheath, Anthony Jones — _Functional Reactive Programming_
  (Manning, 2016) — the model Continuum stands on;
  [our chapter-by-chapter companion](https://github.com/denislibs/continuum/blob/main/FRP-MODEL.md).
- David Harel, Amir Pnueli — _On the Development of Reactive Systems_
  (1985) — where the word "reactive" comes from.
- Ingo Maier, Tiark Rompf, Martin Odersky — _Deprecating the Observer
  Pattern_ (2010) — why callbacks can't be fixed by discipline.
- Evan Czaplicki — _A Farewell to FRP_ (2016) — an honest account of why
  Elm walked away from signals.
- Ryan Carniato — essays on fine-grained reactivity (solidjs.com/blog) —
  the signal tradition first-hand.

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
