<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from "vue";
import { transpile } from "./transpile";
import { buildRunnerHtml } from "./runner";
import { encodeCode, decodeCode } from "./share";

const props = withDefaults(
  defineProps<{ code?: string; height?: string }>(),
  { code: "", height: "360px" },
);

const editorHost = ref<HTMLElement | null>(null);
const iframe = ref<HTMLIFrameElement | null>(null);
const logs = ref<{ level: string; text: string }[]>([]);
const errored = ref(false);
const status = ref<"loading" | "ready">("loading");
const copied = ref(false);

const view = shallowRef<import("@codemirror/view").EditorView | null>(null);
let iframeReady = false;
let pendingRun = false;

function currentSource(): string {
  return view.value ? view.value.state.doc.toString() : props.code;
}

async function run() {
  logs.value = [];
  errored.value = false;
  const out = transpile(currentSource());
  if (out.error) {
    errored.value = true;
    logs.value = [{ level: "error", text: out.error }];
    return;
  }
  if (!iframeReady) {
    pendingRun = true;
    return;
  }
  iframe.value?.contentWindow?.postMessage(
    { type: "run", code: out.code },
    "*",
  );
}

function onMessage(e: MessageEvent) {
  if (e.source !== iframe.value?.contentWindow) return;
  const d = e.data;
  if (d?.type === "ready") {
    iframeReady = true;
    if (pendingRun) {
      pendingRun = false;
      run();
    }
  } else if (d?.type === "console") {
    logs.value.push({ level: d.level, text: d.text });
  } else if (d?.type === "error") {
    errored.value = true;
    logs.value.push({ level: "error", text: d.message });
  } else if (d?.type === "clear") {
    logs.value = [];
    errored.value = false;
  }
}

async function share() {
  const enc = encodeCode(currentSource());
  const url = `${location.origin}${location.pathname}#code=${enc}`;
  history.replaceState(null, "", `#code=${enc}`);
  try {
    await navigator.clipboard.writeText(url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* clipboard blocked — the URL bar still holds the link */
  }
}

function reset() {
  if (!view.value) return;
  view.value.dispatch({
    changes: { from: 0, to: view.value.state.doc.length, insert: props.code },
  });
  run();
}

onMounted(async () => {
  // Initial source: URL fragment wins over the prop so shared links restore.
  let initial = props.code;
  const m = location.hash.match(/#code=([^&]+)/);
  if (m) {
    const decoded = decodeCode(m[1]);
    if (decoded) initial = decoded;
  }

  const [{ EditorView, keymap }, { basicSetup }, { javascript }, { oneDark }, { indentWithTab }] =
    await Promise.all([
      import("@codemirror/view"),
      import("codemirror"),
      import("@codemirror/lang-javascript"),
      import("@codemirror/theme-one-dark"),
      import("@codemirror/commands"),
    ]);

  view.value = new EditorView({
    doc: initial,
    parent: editorHost.value!,
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      javascript({ jsx: true, typescript: true }),
      oneDark,
    ],
  });

  const res = await fetch(
    `${import.meta.env.BASE_URL}playground/vendor/importmap.json`,
  );
  const { imports } = await res.json();
  // Absolutize the root-relative vendor paths against this origin: the iframe
  // is srcdoc (base about:srcdoc), so bare "/continuum/..." would not resolve.
  const absolute: Record<string, string> = {};
  for (const [k, v] of Object.entries(imports as Record<string, string>)) {
    absolute[k] = v.startsWith("/") ? location.origin + v : v;
  }
  window.addEventListener("message", onMessage);
  iframe.value!.srcdoc = buildRunnerHtml(absolute);
  status.value = "ready";
  run();
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
  view.value?.destroy();
});
</script>

<template>
  <div class="cn-play" :style="{ '--cn-play-h': height }">
    <div class="cn-play__bar">
      <button class="cn-play__btn cn-play__btn--run" @click="run">▶ Run</button>
      <button class="cn-play__btn" @click="reset">Reset</button>
      <button class="cn-play__btn" @click="share">
        {{ copied ? "Copied ✓" : "Share" }}
      </button>
      <span class="cn-play__status" v-if="status === 'loading'">loading…</span>
    </div>
    <div class="cn-play__panes">
      <div class="cn-play__editor" ref="editorHost"></div>
      <div class="cn-play__preview">
        <iframe
          ref="iframe"
          title="Playground preview"
          sandbox="allow-scripts allow-same-origin allow-modals"
        ></iframe>
        <div class="cn-play__console" v-if="logs.length">
          <div
            v-for="(l, i) in logs"
            :key="i"
            class="cn-play__log"
            :class="`cn-play__log--${l.level}`"
          >{{ l.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cn-play {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
  background: var(--vp-c-bg-alt);
}
.cn-play__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.cn-play__btn {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s;
}
.cn-play__btn:hover {
  background: var(--vp-c-default-soft);
}
.cn-play__btn--run {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.cn-play__status {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-left: auto;
}
.cn-play__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: var(--cn-play-h);
}
.cn-play__editor {
  overflow: auto;
  border-right: 1px solid var(--vp-c-divider);
  max-height: 70vh;
}
.cn-play__editor :deep(.cm-editor) {
  height: 100%;
  font-size: 13px;
}
.cn-play__preview {
  display: flex;
  flex-direction: column;
  background: #fff;
}
.cn-play__preview iframe {
  flex: 1;
  border: 0;
  width: 100%;
  min-height: 180px;
}
.cn-play__console {
  border-top: 1px solid var(--vp-c-divider);
  max-height: 140px;
  overflow: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  background: var(--vp-c-bg-alt);
}
.cn-play__log {
  padding: 3px 10px;
  white-space: pre-wrap;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}
.cn-play__log--error {
  color: var(--vp-c-danger-1);
}
.cn-play__log--warn {
  color: var(--vp-c-warning-1);
}
@media (max-width: 640px) {
  .cn-play__panes {
    grid-template-columns: 1fr;
  }
  .cn-play__editor {
    border-right: 0;
    border-bottom: 1px solid var(--vp-c-divider);
  }
}
</style>
