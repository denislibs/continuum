// Runs the real Continuum compiler (the vite-plugin's babel transform) in the
// browser to show what ordinary JSX compiles into: statics glued into one
// parse-once template, dynamics reduced to insert/prop/event holes. This is
// the "no re-renders" story made visible — the compiled output panel.
//
// The transform is the exact plugin shipped in @continuum-js/vite-plugin, so
// the panel never drifts from what a real build produces.
import { transform } from "@babel/standalone";
import { continuumJsx } from "@continuum-js/vite-plugin/transform";
import type { TranspileResult } from "./transpile";

export function compileToTemplates(source: string): TranspileResult {
  try {
    const out = transform(source, {
      filename: "playground.tsx",
      presets: [["typescript", { isTSX: true, allExtensions: true }]],
      // continuumJsx handles the JSX it is sure about; whatever it leaves as
      // JSX falls through to the runtime factory, matching a real build.
      plugins: [
        continuumJsx,
        [
          "transform-react-jsx",
          { runtime: "automatic", importSource: "@continuum-js/dom" },
        ],
      ],
    });
    return { code: out.code ?? "", error: null };
  } catch (e) {
    return { code: null, error: (e as Error).message };
  }
}
