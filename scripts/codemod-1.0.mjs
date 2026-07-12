#!/usr/bin/env node
// Continuum 1.0 codemod: rewrites the deprecated pre-1.0 names to the final
// API in-place. Text-based and word-boundary-safe — covers every mechanical
// rename and PRINTS a warning for the few call sites that need a human
// (argument order changes).
//
//   node scripts/codemod-1.0.mjs <dir> [...more dirs]
//
// Mechanical (rewritten automatically):
//   Wire -> State          wire( -> state(       WireSource -> StateSource
//   Behavior -> State      newEvent -> newStream distinctB -> dedupe
//   .gate( -> .when(       .orElse( -> .or(
//   Wire/State/Behavior.switchB(x) / .switchE(x) -> flatten(x)
//   const [b, set] = newBehavior(init) -> const b = state(init); set = b.set
//   import { Event } from "@continuum-js/..." -> Stream (imports only)
//
// Flagged for manual review (argument order differs):
//   e.snapshot(b, f)        -> b.at(e, (value, event) => f(event, value))
//   Wire.lift2(f, a, b)     -> combine(a, b, f)
//   Wire.lift3(f, a, b, c)  -> combine(a, b, c, f)
//   Wire.apply(bf, ba)      -> combine(bf, ba, (f, a) => f(a))

import fs from "node:fs";
import path from "node:path";

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"]);
const SKIP = new Set(["node_modules", "dist", ".git", ".tsout", "coverage"]);

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("usage: node scripts/codemod-1.0.mjs <dir> [...more dirs]");
  process.exit(1);
}

let changed = 0;
const warnings = [];

function rewrite(file) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;

  // imports of Event/newEvent from @continuum-js packages only — a bare
  // global rename would collide with DOM's Event
  s = s.replace(
    /import\s*(type\s*)?\{([^}]*)\}\s*from\s*(["']@continuum-js\/[^"']+["'])/g,
    (m, ty, names, from) => {
      const fixed = names
        .replace(/\bnewEvent\b/g, "newStream")
        .replace(/\bEvent\b/g, "Stream")
        .replace(/\bnewBehavior\b/g, "state")
        .replace(/\bBehavior\b/g, "State")
        .replace(/\bWireSource\b/g, "StateSource")
        .replace(/\bWire\b/g, "State")
        .replace(/\bwire\b/g, "state")
        .replace(/\bdistinctB\b/g, "dedupe");
      // dedupe repeated names introduced by merges (e.g. Wire + State)
      const seen = new Set();
      const parts = fixed
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p && !seen.has(p) && seen.add(p));
      return `import ${ty ?? ""}{ ${parts.join(", ")} } from ${from}`;
    },
  );

  // tuple factory: const [b, set] = newBehavior(init) (single-line form)
  s = s.replace(
    /const\s*\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*newBehavior(<[^;\n]*?>)?\(([^;\n]*)\);/g,
    (_m, b, set, ty, args) =>
      `const ${b} = state${ty ?? ""}(${args});\nconst ${set} = ${b}.set;`,
  );

  // switches collapse into flatten
  s = s.replace(/\b(?:Wire|State|Behavior)\.switch[BE]\(/g, "flatten(");

  // simple renames
  s = s.replace(/\bWireSource\b/g, "StateSource");
  s = s.replace(/\bWire\b/g, "State");
  s = s.replace(/\bBehavior\b/g, "State");
  s = s.replace(/\bwire\b/g, "state");
  s = s.replace(/\bdistinctB\b/g, "dedupe");
  s = s.replace(/\.gate\(/g, ".when(");
  s = s.replace(/\.orElse\(/g, ".or(");

  // manual-review flags
  for (const [pattern, hint] of [
    [
      /\.snapshot\(/g,
      "e.snapshot(b, f) -> b.at(e, (value, event) => f(event, value))",
    ],
    [/\blift2\(/g, "lift2(f, a, b) -> combine(a, b, f)"],
    [/\blift3\(/g, "lift3(f, a, b, c) -> combine(a, b, c, f)"],
    [
      /\bState\.apply\(/g,
      "State.apply(bf, ba) -> combine(bf, ba, (f, a) => f(a))",
    ],
    [
      /\bnewBehavior\b/g,
      "newBehavior(init) -> state(init) (returns ONE value with .set, not a tuple)",
    ],
  ]) {
    let m;
    const re = new RegExp(pattern.source, "g");
    while ((m = re.exec(s)) !== null) {
      const line = s.slice(0, m.index).split("\n").length;
      warnings.push(`${file}:${line}  ${hint}`);
    }
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    changed++;
    console.log(`rewrote ${file}`);
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (EXTS.has(path.extname(full))) rewrite(full);
  }
}

for (const d of dirs) walk(d);
console.log(`\n${changed} file(s) rewritten.`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} call site(s) need manual review:`);
  for (const w of warnings) console.log("  " + w);
}
