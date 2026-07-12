// The Sodium rename, applied here for the same reason the Sodium book did
// it: to most people an "event" is ONE occurrence, while this type is the
// whole stream of them (and it collided with the DOM's global Event).
// `Stream`/`newStream` are the names; `Event`/`newEvent` stay as deprecated
// aliases until 1.0.
import { describe, test, expect } from "vitest";
import { Stream, newStream } from "@continuum-js/frp";

describe("Stream naming", () => {
  test("newStream creates a working source", () => {
    const [s, fire] = newStream<number>();
    const seen: number[] = [];
    const un = s.listen((v) => seen.push(v));
    fire(1);
    fire(2);
    un();
    expect(seen).toEqual([1, 2]);
  });

  test("Stream.merge exists under the new name", () => {
    const [a, fireA] = newStream<number>();
    const [b] = newStream<number>();
    const seen: number[] = [];
    const un = Stream.merge(a, b, (l, r) => l + r).listen((v) => seen.push(v));
    fireA(7);
    un();
    expect(seen).toEqual([7]);
  });
});
