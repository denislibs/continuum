// Row data + pure helpers for the js-framework-benchmark table.
// The label vocabulary matches the official benchmark so results are comparable.

import { newBehavior, type Behavior } from "@continuum-js/frp";

const ADJECTIVES = [
  "pretty", "large", "big", "small", "tall", "short", "long", "handsome",
  "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful",
  "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap",
  "expensive", "fancy",
];
const COLOURS = [
  "red", "yellow", "blue", "green", "pink", "brown", "purple", "brown",
  "white", "black", "orange",
];
const NOUNS = [
  "table", "chair", "house", "bbq", "desk", "car", "pony", "cookie",
  "sandwich", "burger", "pizza", "mouse", "keyboard",
];

/** A row: id plus a per-row `label` behavior, so an update patches one text node. */
export interface Row {
  id: number;
  label: Behavior<string>;
  setLabel: (s: string) => void;
}

/** Small deterministic PRNG (mulberry32) — used only to make tests reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(xs: T[], rnd: () => number): T =>
  xs[Math.floor(rnd() * xs.length)];

/** "adjective colour noun", e.g. "elegant green pony". */
export function buildLabel(rnd: () => number = Math.random): string {
  return `${pick(ADJECTIVES, rnd)} ${pick(COLOURS, rnd)} ${pick(NOUNS, rnd)}`;
}

let idCounter = 1;

/** Build `n` fresh rows with monotonically increasing ids. */
export function buildRows(n: number, rnd: () => number = Math.random): Row[] {
  const rows: Row[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const [label, setLabel] = newBehavior(buildLabel(rnd));
    rows[i] = { id: idCounter++, label, setLabel };
  }
  return rows;
}

/** Return a new array with positions `i` and `j` exchanged (no-op if out of range). */
export function swap<T>(arr: T[], i: number, j: number): T[] {
  if (arr.length <= Math.max(i, j)) return arr;
  const copy = arr.slice();
  const tmp = copy[i];
  copy[i] = copy[j];
  copy[j] = tmp;
  return copy;
}
