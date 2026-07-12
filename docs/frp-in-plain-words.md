# What is FRP — in plain words

Continuum is built on "functional reactive programming" (FRP). Sounds
intimidating. In truth you have already used it — if you have ever opened
Excel. This page explains the whole idea without a single clever word.

## You already know how to do this: Excel

Type the formula `=A1+B1` into cell `C1`. Now change `A1` — and `C1` updates
**by itself**. You never wrote "when A1 changes, recalculate C1, and don't
forget D4 which depends on C1". The spreadsheet knows what depends on what,
and keeps everything current on its own.

That is **reactive programming**. All of it. The core idea is one sentence:

> You declare **what depends on what**, and the system makes sure it stays
> true.

## How ordinary code lives without it

In plain JavaScript, variables are dead cells. Change one — the others never
find out:

```js
let a = 1;
let c = a + 1; // c = 2
a = 5; // c is still 2. Nobody told it.
```

That is why classic UI code is a manual news service: "button clicked →
update the counter → and the label → and don't forget to disable Submit".
Every "don't forget" is a future bug: miss one spot and the page lies.

React solves it its own way: "let's not notify anyone — just redraw the
whole component and diff what changed". It works, but you end up fighting
the consequences of redraws: memoization, dependency arrays, stale closures.

FRP solves it the Excel way: **don't redraw — connect**.

## The three words you need

**A reactive value** (in code: `State`). This is the Excel cell: it
always has a current value, and everything that depends on it updates by
itself. The text of an input, a counter, the current user.

```ts
const count = state(0); // a cell holding 0
```

**A derived value** — the formula. Not stored, computed from others:

```ts
const double = count.map((n) => n * 2); // =count*2, always current
```

**An event** (in code: `Stream`) — something that _happens_ rather than
_is_. A click, a key press, a server response. A click has no "current
value" — it either happened or it didn't. As a beginner, plain callbacks
(`onClick={() => …}`) are all you need; events become useful later, for
streams like debounced search.

## Stream vs State — as plainly as it gets {#event-vs-behavior}

Compare two things from everyday life:

- **The temperature outside.** It exists _at all times_. Any second you can
  look at the thermometer and get an answer. "What's the temperature right
  now?" always makes sense.
- **A knock on the door.** It _happens_. Between knocks there is no knock —
  "what's the current knock?" is a meaningless question. What makes sense
  is "did someone knock?" and "what do we do when they knock?".

The temperature is a **State**. The knock is a **Stream**. The whole
difference is which question you are asking:

| Question                                         | Type     | Examples                                                                 |
| ------------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| "What is it **right now**?"                      | `State`  | text in a field, a counter, the selected tab, "logged in?", window width |
| "**Did** it happen? What do we do when it does?" | `Stream` | a click, Enter pressed, a server response arrived, a timer ticked        |

The one-sentence test: **if you can draw it on the screen, it's a State.
If you can react to it, it's a Stream.** The number on a button gets drawn —
State. The click itself can't be drawn — it gets reacted to — Stream.

Why not make do with one type? Try stuffing a click into a "cell": what
value does it hold between clicks? You'd invent a `clicked = true` flag and
have to remember to reset it — the classic source of "the button fired
twice" bugs. Now try the reverse and make temperature an event: to learn
"what is it now" you'd have to remember the last notification, and before
the first one arrives you have no answer at all. Each thing is awkward in
the other one's skin — which is why there are two types.

They cooperate and convert into each other: "the latest server response" is
already a _value_ (`responses.hold(null)`: event → State), and "the
moments when the counter changed" is already an _event_ (`count.updates`:
State → event, one occurrence per moment).

## Where the "functional" comes in

Excel formulas are pure: `=A1+B1` cannot secretly turn on your TV or tamper
with a neighboring cell. That is exactly why the spreadsheet can be trusted.

The "functional" in FRP is the same promise: derived values are described by
pure functions (`map`, like a formula), and the only way to affect a value
is through the declared connections. No "tweaking from the side". A formula
is just a recipe — it computes on demand and needs no owner; the _cells_
(state) belong to the component that created them, like a formula belongs to
its sheet. Hence the main guarantee: **the page cannot display a state that
never existed**.

You can see it in Excel too: changing `A1`, you will never catch the sheet
"half-recalculated" — `C1` already new while `D4`, which depends on it, is
still old. Continuum gives the same guarantee for your UI: every change
lands whole, as one indivisible step. (Internally this is called a
"transaction", but you don't need the word — it just means "like Excel".)

## The last piece: a component is an assembly, not a drawing

In React a component is a painter: state changed — repaint the picture. In
Continuum a component is an assembler: it builds its piece of the page
**once** out of cells and connections — and leaves. From then on the
construction lives on its own: a value changes → exactly the piece of DOM
bound to it updates (we call this pinpoint DOM updates).

```tsx
function Counter() {
  const count = state(0); // a cell
  return (
    <button onClick={() => count.update((n) => n + 1)}>
      count: {count} {/* this text is bound to the cell, forever */}
    </button>
  );
}
```

`{count}` in JSX doesn't mean "insert the current number" — it means "this
text now displays count. Always." The `Counter` function never runs again —
it has no reason to.

## The correspondence cheat sheet

| Excel                           | Continuum               | In plain words                            |
| ------------------------------- | ----------------------- | ----------------------------------------- |
| a cell with a value             | `state(0)`              | a reactive value                          |
| the formula `=A1*2`             | `count.map(n => n * 2)` | a derived value                           |
| a formula over two cells        | `combine(a, b, f)`      | derived from several                      |
| the whole sheet recalcs at once | a transaction           | changes land whole                        |
| — (Excel has none)              | `Stream`                | a stream of happenings: clicks, responses |

## What's next

- [Quick start](/quick-start) — touch it in five minutes.
- [Concepts](/concepts/components) — one idea per page, in the same plain
  language.
- Curious how it works inside —
  [Thinking in States and Streams](/tutorial/thinking-in-frp).

---

> Unfamiliar term? Every piece of jargon in these docs is explained in the [glossary](/glossary).
