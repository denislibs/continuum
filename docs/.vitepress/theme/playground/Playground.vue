<script setup lang="ts">
import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from "vue";
import { transpile } from "./transpile";
import { compileToTemplates } from "./compile";
import { buildRunnerHtml } from "./runner";
import { encodeCode, decodeCode } from "./share";
import type { EditorHandle } from "./monaco";

const props = withDefaults(
  defineProps<{ code?: string; height?: string; full?: boolean }>(),
  { code: "", height: "360px", full: false },
);

const editorHost = ref<HTMLElement | null>(null);
const outputHost = ref<HTMLElement | null>(null);
const iframe = ref<HTMLIFrameElement | null>(null);
const logs = ref<{ level: string; text: string }[]>([]);
const errored = ref(false);
const status = ref<"loading" | "ready">("loading");
const copied = ref(false);
const tab = ref<"preview" | "compiled" | "js">("preview");
const compiledOut = ref("");
const jsOut = ref("");

const editor = shallowRef<EditorHandle | null>(null);
const output = shallowRef<EditorHandle | null>(null);
let iframeReady = false;
let pendingRun = false;

function currentSource(): string {
  return editor.value ? editor.value.getValue() : props.code;
}

function syncOutput() {
  if (!output.value) return;
  output.value.setValue(
    tab.value === "compiled" ? compiledOut.value : jsOut.value,
  );
  output.value.layout();
}

function refreshOutputs() {
  const src = currentSource();
  const c = compileToTemplates(src);
  compiledOut.value = c.error ? `// ${c.error}` : (c.code ?? "");
  const j = transpile(src);
  jsOut.value = j.error ? `// ${j.error}` : (j.code ?? "");
  syncOutput();
}

watch(tab, (t) => {
  if (t !== "preview") {
    if (!compiledOut.value && !jsOut.value) refreshOutputs();
    else syncOutput();
  }
});

async function run() {
  logs.value = [];
  errored.value = false;
  compiledOut.value = "";
  jsOut.value = "";
  if (tab.value !== "preview") refreshOutputs();
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
  editor.value?.setValue(props.code);
  run();
}

onMounted(async () => {
  let initial = props.code;
  const m = location.hash.match(/#code=([^&]+)/);
  if (m) {
    const decoded = decodeCode(m[1]);
    if (decoded) initial = decoded;
  }

  const { createEditor } = await import("./monaco");
  editor.value = createEditor(editorHost.value!, { value: initial });
  output.value = createEditor(outputHost.value!, {
    value: "",
    readOnly: true,
    language: "javascript",
  });

  const res = await fetch(
    `${import.meta.env.BASE_URL}playground/vendor/importmap.json`,
  );
  const { imports } = await res.json();
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
  editor.value?.dispose();
  output.value?.dispose();
});
</script>

<template>
  <div
    class="cn-play"
    :class="{ 'cn-play--full': full }"
    :style="full ? undefined : { '--cn-play-h': height }"
  >
    <div class="cn-play__bar">
      <button class="cn-play__btn cn-play__btn--run" @click="run">▶ Run</button>
      <button class="cn-play__btn" @click="reset">Reset</button>
      <button class="cn-play__btn" @click="share">
        {{ copied ? "Copied ✓" : "Share" }}
      </button>
      <span class="cn-play__file">main.tsx</span>
      <span class="cn-play__status" v-if="status === 'loading'">loading…</span>
    </div>
    <div class="cn-play__panes">
      <div class="cn-play__editor" ref="editorHost"></div>
      <div class="cn-play__right">
        <div class="cn-play__tabs">
          <button
            class="cn-play__tab"
            :class="{ 'cn-play__tab--on': tab === 'preview' }"
            @click="tab = 'preview'"
          >
            Preview
          </button>
          <button
            class="cn-play__tab"
            :class="{ 'cn-play__tab--on': tab === 'compiled' }"
            @click="tab = 'compiled'"
          >
            Compiled
          </button>
          <button
            class="cn-play__tab"
            :class="{ 'cn-play__tab--on': tab === 'js' }"
            @click="tab = 'js'"
          >
            JS
          </button>
        </div>
        <div class="cn-play__preview" v-show="tab === 'preview'">
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
            >
              {{ l.text }}
            </div>
          </div>
        </div>
        <div
          class="cn-play__output"
          v-show="tab !== 'preview'"
          ref="outputHost"
        ></div>
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
.cn-play--full {
  margin: 0;
  border: 0;
  border-radius: 0;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  height: calc(100vh - var(--vp-nav-height, 64px));
  display: flex;
  flex-direction: column;
}
.cn-play__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex: 0 0 auto;
}
.cn-play__btn {
  font-size: 13px;
  font-weight: 500;
  padding: 5px 14px;
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
.cn-play__file {
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin-left: 6px;
}
.cn-play__status {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-left: auto;
}
.cn-play__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.cn-play:not(.cn-play--full) .cn-play__panes {
  min-height: var(--cn-play-h);
  height: var(--cn-play-h);
}
.cn-play--full .cn-play__panes {
  flex: 1 1 auto;
  min-height: 0;
}
.cn-play__editor {
  border-right: 1px solid var(--vp-c-divider);
  min-width: 0;
  overflow: hidden;
}
.cn-play__right {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.cn-play__tabs {
  display: flex;
  gap: 2px;
  padding: 4px 6px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  flex: 0 0 auto;
}
.cn-play__tab {
  font-size: 12px;
  padding: 5px 12px;
  border: 0;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.cn-play__tab--on {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.cn-play__preview {
  display: flex;
  flex-direction: column;
  background: #fff;
  flex: 1 1 auto;
  min-height: 0;
}
.cn-play__preview iframe {
  flex: 1;
  border: 0;
  width: 100%;
  min-height: 180px;
}
.cn-play__output {
  flex: 1 1 auto;
  min-height: 0;
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
    min-height: 260px;
  }
}
</style>
