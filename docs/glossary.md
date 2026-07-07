# Glossary

All the documentation's terminology in one place, in plain words. Terms are
grouped by theme; pages link to them by anchor.

## The model of time

### Behavior {#behavior}

**A value across time.** At any moment you can ask a Behavior "what are you
right now?" — and there is always an answer. The text of an input, the
current user, the mouse position: they _exist_ at every moment, even when
nobody is looking. Formally, a function from time to value (`Time → A`).
More: [Behaviors](/concepts/behaviors).

### Event {#event}

**A stream of happenings.** Unlike a Behavior, you cannot ask an event "what
are you now" — between firings it simply _isn't_. A click, a keypress, a
server response: not values that exist, but things that _happen_. More:
[Events](/concepts/events).

### Occurrence {#occurrence}

**One firing of an event.** A pair of "moment + value": the third click,
one specific server response. When we say "an Event is discrete
occurrences", we mean: an event is a set of individual firings, not a
continuous quantity.

### Discrete {#discrete}

**Made of separate points rather than continuous.** Discrete time is a
sequence of individual moments (a tick, a click, a response) with nothing in
between. The opposite is continuous time, as in physics. Continuum is
_discrete_ FRP: change happens in transaction-moments.

### Moment / transaction {#transaction}

**One atomic "tick" of logical time.** Everything that follows from one
event — all derived values — recomputes inside a single moment, as one
whole: from outside you can never see "half" an update. "Logical" time
because moments are counted by order, not milliseconds — only
_before/after/simultaneous_ matters. More:
[Transactions and time](/concepts/transactions).

### Simultaneity {#simultaneity}

**Two occurrences in one moment.** In callback world, "simultaneous" events
actually run in some arbitrary order. In Continuum simultaneity is real: two
events in one moment see the same world, and merging them (`merge`) forces
you to say what to do with the pair.

### Coalescing {#coalescing}

**Folding simultaneous occurrences into one.** When two events happen in the
same moment but one must come out, the coalescing function (`(a, b) => …` in
`Event.merge`) combines them. Without it you'd have to pick "who was first" —
which is a race.

### Glitch {#glitch}

**Observable half-updated state.** The classic reactive-systems bug:
`sum = a + b` where `a` has updated but `b` hasn't yet, and for an instant
`sum` shows nonsense. In Continuum glitches are impossible by construction —
a moment is atomic. The "diamond" example:
[Transactions and time](/concepts/transactions).

### Diamond {#diamond}

**The dependency shape where glitches show up.** One value feeds two
branches which reconverge in a shared descendant: `count → doubled`,
`count → squared`, `doubled + squared → sum`. Naive reactivity recomputes
`sum` twice (the second time as a correction); a transaction does it once,
correctly.

### The `hold` delay {#hold-delay}

**The rule: a Behavior updates at the moment's boundary.** Within the moment
an occurrence arrives, `hold`/`accum` still show the _old_ value. Sounds
odd, but this is exactly what makes "the current value" well-defined when
you look at it from the event that is changing it: the past is stable, the
present is still forming. More:
[Transactions and time](/concepts/transactions).

### Fold {#fold}

**Accumulating an event's history into one value.**
`clicks.accum(0, (_e, n) => n + 1)` — "start at 0 and add 1 per click": a
counter is a fold of clicks. The same move as `Array.reduce`, but over time
instead of over an array.

### push / pull {#push-pull}

**Two ways of delivering values.** Events _push_: something happened — it
propagates through the graph. Behaviors _pull_: the value is computed when
asked. Continuum is a hybrid: changes propagate by pushing, `sample()` reads
by pulling.

## The network

### Network / dependency graph {#network}

**Everything you built out of Behaviors and Events.** `map`, `lift`,
`merge`, `snapshot` wire quantities into a directed graph: nodes are values
and events, edges are "computed from". A component builds its piece of the
graph once; updates flow through it afterwards.

### Rank {#rank}

**A node's depth in the graph.** The internal mechanism of glitch-freedom:
nodes recompute in rank order (sources first, then deriveds, then deriveds
of deriveds), so a node never fires before its inputs. You never touch
ranks — they are just there.

### `snapshot` {#snapshot}

**An event photographs a value.** `clicks.snapshot(draft, …)` — "at the
moment of the click, take the field's text". The FRP replacement for the
habit of "I'll read the variable inside the handler", but with exact
semantics: snapshot sees the value _before_ the current moment (see
[the hold delay](#hold-delay)).

### `sample` {#sample}

**Read a Behavior's current value directly.** `b.sample()` is for code
_outside_ the network: initialization, tests, integrating foreign code.
Inside the network prefer [snapshot](#snapshot) — its simultaneity is
defined.

### Hatch {#hatch}

**An explicit door between the pure network and the outside world.** In:
`newEvent` / `newBehavior` (inject a value). Out: `listen` (run a side
effect), `perform` (do IO and return the result as an event). The word
emphasizes that the network's boundaries are visible in the code, not
smeared everywhere.

### `Result` {#result}

**An error as data.** `{ ok: true, value } | { ok: false, error }` — the
outcome of IO where failure is an ordinary value branch, not a thrown
exception. You can filter errors, accumulate them, render them — like any
data.

## Rendering

### Fine-grained rendering {#fine-grained}

**Exactly what depends on a value updates.** Not "re-render the component
and diff", but "this text node is bound to this Behavior — patch it". This
is why components run once and there is no virtual DOM.

### Binding {#binding}

**A live link Behavior → a piece of DOM.** `{count}` in JSX doesn't mean
"insert the current value"; it means "this text node now shows count,
forever". Same for attributes: `class={cls}`.

### Re-render {#re-render}

**A foreign concept (React) we define ourselves against.** Re-running a
component function to compute a new tree. Continuum has none: a component
runs once, updates travel through bindings.

### Dynamic region {#dynamic-region}

**A stretch of DOM rebuilt from a value.** The `dyn` primitive (and its
sugar — `Show`, `Dynamic`): a subtree lives between comment markers; when
the driving value changes, the old subtree is disposed and a new one is
built. Values change bindings; _structure_ changes through regions. More:
[Conditional rendering](/concepts/conditional-rendering).

### Keyed reconciliation / LIS {#keyed}

**Matching list rows by key and reordering minimally.** `<Each>` keeps one
live subtree per key; on reorder it computes the longest increasing
subsequence (LIS) and moves only what actually moved. More:
[List rendering](/concepts/list-rendering).

### last-request-wins {#last-request-wins}

**The response-race rule: the latest request wins.** If the user asked for
page 2 and then page 3, a late response for "2" is ignored. `resource`
solves this internally by numbering requests.

### Chunk / code splitting {#code-splitting}

**Cutting the bundle into pieces loaded on demand.** A literal
`import("./Page")` in the code signals the bundler to emit a separate file
(chunk), downloaded on first visit. Here — via the router's `lazy`.

## Lifecycle

### Ownership tree {#ownership}

**Whoever builds it cleans it up.** Everything a component creates
(subscriptions, timers, nested regions) registers with its "owner";
disposing a subtree releases resources in a cascade — children first, then
the parent. More: [Ownership and lifecycle](/concepts/ownership).

### Scope {#scope}

**One node of the ownership tree.** Every dynamic region and every `<Each>`
row creates its own scope: it has its own `onCleanup`/`onMount`, and it dies
as a whole.

### Error boundary {#error-boundary}

**A safety net for a piece of the page.** If building or rebuilding a
subtree throws, the nearest `<Catch>` above it disposes the broken subtree
(with all its subscriptions) and shows a fallback instead of killing the
whole app. More: [Conditional rendering](/concepts/conditional-rendering#catch).

### Cascading cleanup {#cascade}

**Disposing a subtree frees everything inside automatically.** A page goes
away — its subscriptions unsubscribe, its timers stop, its portaled modals
vanish. No "on unmount, remember to…" — the ownership tree remembers for
you.

### Context {#context}

**Values available to descendants without prop drilling.** `provide` puts a
value into the current owner, `use` looks it up through ancestors. More:
[Context](/concepts/context).

## The wider world

### Classic (discrete) FRP {#classic-frp}

**The branch of FRP Continuum belongs to.** Time is a sequence of
transactions; combinators have exact semantics (Sodium, the Blackheath &
Jones book). Contrasted both with Elliott's _continuous_ FRP (time as in
physics) and with the "reactivity" of signals/Rx. See
[History and context](/history).

### Denotational semantics {#denotational}

**Defining constructs by mathematical meaning, not by implementation.**
"`merge` is the union of occurrence sets with coalescing of simultaneous
ones" — an equation you can prove properties from (glitch-freedom, for one),
not a description of a loop in code.

### Signals {#signals}

**The neighboring reactivity tradition (Solid, Vue, Angular, TC39).**
Dependencies are tracked automatically when a value is read; the graph is
implicit. Convenient to write; harder to reason about. The comparison lives
in [History and context](/history).

### The synchronous hypothesis {#synchronous-hypothesis}

**The 1980s synchronous-languages idea: a reaction is conceptually
instantaneous.** While the system reacts to an event, new events "wait
outside" — which makes each reaction atomic. Continuum's transactions are a
direct inheritance of this idea.
