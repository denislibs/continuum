// Browser-side transpile for the playground: TypeScript + Continuum JSX →
// runnable ESM. Types are stripped, JSX compiles through the automatic
// runtime pointed at @continuum-js/dom, and bare @continuum-js/* imports are
// left untouched so the iframe's import map can resolve them to the local
// ESM bundles. Pure and synchronous — the UI layer owns loading Babel.
import { transform } from "@babel/standalone";

export interface TranspileResult {
  /** Runnable ESM, or null when the source did not compile. */
  code: string | null;
  /** Human-readable error message, or null on success. */
  error: string | null;
}

export function transpile(source: string): TranspileResult {
  try {
    const out = transform(source, {
      filename: "playground.tsx",
      presets: [["typescript", { isTSX: true, allExtensions: true }]],
      plugins: [
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
