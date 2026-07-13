import { describe, test, expect } from "vitest";
import { matchChain, type RouteDef } from "../src/match.js";

const home: RouteDef = { path: "" };
const about: RouteDef = { path: "about" };
const userShow: RouteDef = { path: ":id" };
const userIndex: RouteDef = { path: "" };
const users: RouteDef = { path: "users", children: [userIndex, userShow] };
const catchAll: RouteDef = { path: "*" };
const routes: RouteDef[] = [home, about, users, catchAll];

const defs = (m: ReturnType<typeof matchChain>) =>
  m && "chain" in m ? m.chain.map((e) => e.def) : m;

describe("matchChain", () => {
  test("matches the index route at /", () => {
    expect(defs(matchChain(routes, "/"))).toEqual([home]);
  });

  test("matches a static segment", () => {
    expect(defs(matchChain(routes, "/about"))).toEqual([about]);
  });

  test("matches nested index", () => {
    expect(defs(matchChain(routes, "/users"))).toEqual([users, userIndex]);
  });

  test("matches a param segment and extracts params", () => {
    const m = matchChain(routes, "/users/42");
    expect(defs(m)).toEqual([users, userShow]);
    if (m && "chain" in m) expect(m.chain[1].params).toEqual({ id: "42" });
  });

  test("trailing slash is ignored", () => {
    expect(defs(matchChain(routes, "/users/42/"))).toEqual([users, userShow]);
  });

  test("wildcard catches everything else", () => {
    expect(defs(matchChain(routes, "/no/such/page"))).toEqual([catchAll]);
  });

  test("returns null when nothing matches (no wildcard)", () => {
    expect(matchChain([home, about], "/nope")).toBeNull();
  });

  test("multi-segment static path in one def", () => {
    const deep: RouteDef = { path: "docs/api" };
    expect(defs(matchChain([deep], "/docs/api"))).toEqual([deep]);
  });

  test("params merge down the chain", () => {
    const file: RouteDef = { path: ":file" };
    const repo: RouteDef = { path: ":repo", children: [file] };
    const m = matchChain([repo], "/continuum/readme");
    if (m && "chain" in m) {
      expect(m.chain[0].params).toEqual({ repo: "continuum" });
      // leaf sees ancestors' params merged in
      expect(m.chain[1].params).toEqual({ repo: "continuum", file: "readme" });
    } else {
      expect.unreachable("expected a match");
    }
  });

  test("a guard can redirect", () => {
    const admin: RouteDef = {
      path: "admin",
      guard: () => "/login",
    };
    expect(matchChain([admin, about], "/admin")).toEqual({
      redirect: "/login",
    });
  });

  test("a passing guard lets the match through", () => {
    const admin: RouteDef = { path: "admin", guard: () => true };
    expect(defs(matchChain([admin], "/admin"))).toEqual([admin]);
  });

  test("wildcard match exposes the rest as params['*']", () => {
    const m = matchChain(routes, "/a/b/c");
    if (m && "chain" in m) expect(m.chain[0].params["*"]).toBe("a/b/c");
    else expect.unreachable("expected a match");
  });

  // #120: params arrive percent-encoded from URL.pathname and must be decoded.
  test("param segments are URL-decoded", () => {
    const m = matchChain(routes, "/users/John%20Doe");
    if (m && "chain" in m)
      expect(m.chain[1].params).toEqual({ id: "John Doe" });
    else expect.unreachable("expected a match");
  });

  test("wildcard rest is URL-decoded per segment", () => {
    const m = matchChain(routes, "/a%20b/c%2Bd");
    if (m && "chain" in m) expect(m.chain[0].params["*"]).toBe("a b/c+d");
    else expect.unreachable("expected a match");
  });

  test("malformed encoding falls back to the raw segment", () => {
    const m = matchChain(routes, "/users/%E0%A4%A");
    if (m && "chain" in m) expect(m.chain[1].params.id).toBe("%E0%A4%A");
    else expect.unreachable("expected a match");
  });
});
