// Monaco (the VS Code editor) setup for the playground and tutorial. Imported
// ONLY on the client (dynamic import inside onMounted) — it touches `self`
// and web workers at module load, which don't exist under VitePress SSR.
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

let configured = false;

function configure() {
  if (configured) return;
  configured = true;

  self.MonacoEnvironment = {
    getWorker(_id: string, label: string) {
      if (label === "typescript" || label === "javascript")
        return new tsWorker();
      return new editorWorker();
    },
  };

  const ts = monaco.languages.typescript.typescriptDefaults;
  ts.setCompilerOptions({
    // Automatic runtime pointed at @continuum-js/dom, so intrinsic tags
    // (<button>, <div>…) type through the package's JSX namespace instead of
    // resolving to `any`.
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    jsxImportSource: "@continuum-js/dom",
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    lib: ["esnext", "dom", "dom.iterable"],
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
  });
  // Keep real syntax errors; leave semantic squiggles off (JSX with a custom
  // runtime can't be fully type-checked in-browser). IntelliSense — hover
  // types and autocomplete from the loaded .d.ts — works regardless.
  ts.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  defineTheme();
  void loadTypes();
}

let typesLoaded = false;

// Load the real @continuum-js .d.ts (copied next to the vendor bundles) into
// Monaco's TypeScript worker, so `state`, `.update`, `.map`, `stream`, the DOM
// components etc. get hover types and autocomplete in the editor.
async function loadTypes(): Promise<void> {
  if (typesLoaded) return;
  typesLoaded = true;
  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}playground/vendor/types.json`);
    const { types } = (await res.json()) as {
      types: { path: string; url?: string; content?: string }[];
    };
    const ts = monaco.languages.typescript.typescriptDefaults;
    await Promise.all(
      types.map(async (t) => {
        const content = t.content ?? (await (await fetch(t.url!)).text());
        ts.addExtraLib(content, `file:///${t.path}`);
      }),
    );
  } catch {
    // Types are a nicety; the editor still works fully without them.
  }
}

function defineTheme() {
  monaco.editor.defineTheme("continuum-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#161618",
      "editorGutter.background": "#161618",
    },
  });
  monaco.editor.defineTheme("continuum-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: { "editor.background": "#ffffff" },
  });
}

function isDark(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

export function currentTheme(): string {
  return isDark() ? "continuum-dark" : "continuum-light";
}

let uid = 0;

export interface EditorHandle {
  getValue(): string;
  setValue(v: string): void;
  onChange(cb: () => void): void;
  layout(): void;
  dispose(): void;
}

export function createEditor(
  el: HTMLElement,
  opts: {
    value: string;
    readOnly?: boolean;
    language?: "typescript" | "javascript";
    filename?: string;
  },
): EditorHandle {
  configure();
  const lang = opts.language ?? "typescript";
  const ext = lang === "javascript" ? "js" : "tsx";
  const model = monaco.editor.createModel(
    opts.value,
    lang,
    monaco.Uri.parse(`file:///pg-${uid++}-${opts.filename ?? "main"}.${ext}`),
  );
  const editor = monaco.editor.create(el, {
    model,
    theme: currentTheme(),
    readOnly: !!opts.readOnly,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineHeight: 20,
    scrollBeyondLastLine: false,
    tabSize: 2,
    padding: { top: 12, bottom: 12 },
    fontFamily:
      "var(--vp-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
    smoothScrolling: true,
    renderLineHighlight: opts.readOnly ? "none" : "line",
    overviewRulerLanes: 0,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  });

  // Follow the site's dark/light toggle.
  const obs =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => monaco.editor.setTheme(currentTheme()))
      : null;
  obs?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return {
    getValue: () => editor.getValue(),
    setValue: (v) => editor.setValue(v),
    onChange: (cb) => {
      model.onDidChangeContent(() => cb());
    },
    layout: () => editor.layout(),
    dispose: () => {
      obs?.disconnect();
      model.dispose();
      editor.dispose();
    },
  };
}
