// @continuum-js/vite-plugin — the optional JSX compiler for Continuum.
//
// Drop it into vite plugins and ordinary JSX compiles into cloned templates
// (see PERF-PLAN phase 2). Without the plugin the exact same code runs
// through the runtime factory — the plugin is an accelerator, never a
// requirement. Whatever the transform is not statically sure about is left
// as JSX for the standard esbuild pass.
import { transformSync } from "@babel/core";
import jsxSyntax from "@babel/plugin-syntax-jsx";
import tsSyntax from "@babel/plugin-syntax-typescript";
import { continuumJsx } from "./transform.js";

interface VitePluginShape {
  name: string;
  enforce?: "pre" | "post";
  transform(
    this: unknown,
    code: string,
    id: string,
  ): { code: string; map?: unknown } | null;
}

/** Compile Continuum JSX into cloned templates (optional accelerator). */
export default function continuum(): VitePluginShape {
  return {
    name: "continuum-jsx",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      if (!/\.[jt]sx$/.test(file)) return null;
      if (!code.includes("<")) return null;
      const res = transformSync(code, {
        filename: file,
        babelrc: false,
        configFile: false,
        parserOpts: {
          plugins: file.endsWith(".tsx") ? ["jsx", "typescript"] : ["jsx"],
        },
        plugins: [
          file.endsWith(".tsx") ? [tsSyntax, { isTSX: true }] : jsxSyntax,
          jsxSyntax,
          continuumJsx,
        ],
        sourceMaps: true,
        code: true,
      });
      if (!res?.code) return null;
      return { code: res.code, map: res.map };
    },
  };
}

export { continuumJsx };
