<script setup lang="ts">
import {
  ref,
  shallowRef,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { transpile } from "../playground/transpile";
import { compileToTemplates } from "../playground/compile";
import { buildRunnerHtml } from "../playground/runner";
import { findTrack, tracks as allTracks } from "./tracks";
import { markComplete, isComplete, trackPercent } from "./progress";
import { renderTask } from "./md";
import { burst } from "./confetti";

const props = withDefaults(defineProps<{ track?: string }>(), {
  track: "basics",
});

const track = findTrack(props.track);
const base = import.meta.env.BASE_URL;
// Keep track links inside the current locale (/ru/learn/… under the ru tree).
const localeSeg =
  typeof location !== "undefined" && location.pathname.includes("/ru/")
    ? "ru/"
    : "";
const trackLink = (id: string) => `${base}${localeSeg}learn/${id}`;
const stepIndex = ref(0);
const step = computed(() => track!.steps[stepIndex.value]);
const total = computed(() => track!.steps.length);

const editorHost = ref<HTMLElement | null>(null);
const iframe = ref<HTMLIFrameElement | null>(null);
const view = shallowRef<import("@codemirror/view").EditorView | null>(null);

const logs = ref<{ level: string; text: string }[]>([]);
const tab = ref<"preview" | "compiled" | "js">("preview");
const compiledOut = ref("");
const jsOut = ref("");
const checkState = ref<"idle" | "checking" | "pass" | "fail">("idle");
const checkMsg = ref("");
const solutionShown = ref(false);
const hintShown = ref(false);
const badgeCopied = ref(false);

// Bump on any completion change so the progress bar / ticks recompute.
const progressTick = ref(0);
const percent = computed(() => {
  progressTick.value; // dependency
  return trackPercent({ id: track!.id, steps: track!.steps.map((s) => s.id) });
});
function done(id: string): boolean {
  progressTick.value;
  return isComplete(track!.id, id);
}
const trackDone = computed(() => percent.value === 100);

let iframeReady = false;
let pendingRun = false;

function currentSource(): string {
  return view.value ? view.value.state.doc.toString() : step.value.starter;
}

function setEditor(code: string) {
  if (!view.value) return;
  view.value.dispatch({
    changes: { from: 0, to: view.value.state.doc.length, insert: code },
  });
}

function run() {
  logs.value = [];
  compiledOut.value = "";
  jsOut.value = "";
  if (tab.value !== "preview") refreshOutputs();
  const out = transpile(currentSource());
  if (out.error) {
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

function check() {
  const out = transpile(currentSource());
  if (out.error) {
    checkState.value = "fail";
    checkMsg.value = out.error;
    return;
  }
  checkState.value = "checking";
  checkMsg.value = "";
  iframe.value?.contentWindow?.postMessage(
    {
      type: "check",
      code: out.code,
      checkSrc: step.value.check.toString(),
      id: step.value.id,
    },
    "*",
  );
}

function refreshOutputs() {
  const src = currentSource();
  const c = compileToTemplates(src);
  compiledOut.value = c.error ? `// ${c.error}` : (c.code ?? "");
  const j = transpile(src);
  jsOut.value = j.error ? `// ${j.error}` : (j.code ?? "");
}

watch(tab, (t) => {
  if (t === "compiled" && !compiledOut.value) refreshOutputs();
  if (t === "js" && !jsOut.value) refreshOutputs();
});

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
    logs.value.push({ level: "error", text: d.message });
  } else if (d?.type === "clear") {
    logs.value = [];
  } else if (d?.type === "check-result") {
    checkState.value = d.pass ? "pass" : "fail";
    checkMsg.value = d.message ?? "";
    if (d.pass) {
      markComplete(track!.id, step.value.id);
      progressTick.value++;
      onSolved();
    }
  }
}

function onSolved() {
  // Burst from the Check button so the celebration points at the action.
  const btn = document.querySelector(".cn-tut__btn--check");
  const r = btn?.getBoundingClientRect();
  burst(r ? r.left + r.width / 2 : undefined, r ? r.top : undefined);
}

async function shareBadge() {
  const text = `I completed the “${track!.title}” track in the Continuum tutorial 🎖️`;
  const url = `${location.origin}${location.pathname}`;
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    badgeCopied.value = true;
    setTimeout(() => (badgeCopied.value = false), 1800);
  } catch {
    /* clipboard blocked */
  }
}

function goto(i: number) {
  if (i < 0 || i >= total.value) return;
  stepIndex.value = i;
}

watch(stepIndex, () => {
  solutionShown.value = false;
  hintShown.value = false;
  checkState.value = "idle";
  checkMsg.value = "";
  tab.value = "preview";
  setEditor(step.value.starter);
  run();
});

function showSolution() {
  solutionShown.value = true;
  setEditor(step.value.solution);
  run();
}

onMounted(async () => {
  const [
    { EditorView, keymap },
    { basicSetup },
    { javascript },
    { oneDark },
    { indentWithTab },
  ] = await Promise.all([
    import("@codemirror/view"),
    import("codemirror"),
    import("@codemirror/lang-javascript"),
    import("@codemirror/theme-one-dark"),
    import("@codemirror/commands"),
  ]);
  view.value = new EditorView({
    doc: step.value.starter,
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
  const absolute: Record<string, string> = {};
  for (const [k, v] of Object.entries(imports as Record<string, string>)) {
    absolute[k] = v.startsWith("/") ? location.origin + v : v;
  }
  window.addEventListener("message", onMessage);
  iframe.value!.srcdoc = buildRunnerHtml(absolute);
  run();
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
  view.value?.destroy();
});
</script>

<template>
  <div class="cn-tut" v-if="track">
    <aside class="cn-tut__task">
      <nav class="cn-tut__tracks">
        <a
          v-for="t in allTracks"
          :key="t.id"
          :href="trackLink(t.id)"
          class="cn-tut__tracklink"
          :class="{ 'cn-tut__tracklink--on': t.id === track.id }"
          >{{ t.title }}</a
        >
      </nav>
      <div class="cn-tut__crumbs">
        <span class="cn-tut__track">{{ track.title }}</span>
        <span class="cn-tut__count">{{ stepIndex + 1 }} / {{ total }}</span>
      </div>
      <div class="cn-tut__bar">
        <div class="cn-tut__bar-fill" :style="{ width: percent + '%' }"></div>
      </div>
      <ol class="cn-tut__steps">
        <li
          v-for="(s, i) in track.steps"
          :key="s.id"
          :class="{
            'cn-tut__step--on': i === stepIndex,
            'cn-tut__step--done': done(s.id),
          }"
          @click="goto(i)"
        >
          <span class="cn-tut__tick">{{ done(s.id) ? "✓" : i + 1 }}</span>
          {{ s.title }}
        </li>
      </ol>
      <div v-if="trackDone" class="cn-tut__badge">
        <div class="cn-tut__medal">🎖️</div>
        <strong>{{ track.title }} mastered!</strong>
        <p>You finished every step. Nice work.</p>
        <button @click="shareBadge">
          {{ badgeCopied ? "Copied ✓" : "Share your badge" }}
        </button>
      </div>

      <h2>{{ step.title }}</h2>
      <div class="cn-tut__prose" v-html="renderTask(step.task)"></div>
      <div class="cn-tut__nudges">
        <button v-if="step.hint && !hintShown" @click="hintShown = true">
          Hint
        </button>
        <p v-if="hintShown && step.hint" class="cn-tut__hint">
          {{ step.hint }}
        </p>
        <button v-if="!solutionShown" @click="showSolution">
          Show solution
        </button>
      </div>
    </aside>

    <section class="cn-tut__work">
      <div class="cn-tut__actions">
        <button class="cn-tut__btn cn-tut__btn--run" @click="run">▶ Run</button>
        <button
          class="cn-tut__btn cn-tut__btn--check"
          @click="check"
          :disabled="checkState === 'checking'"
        >
          {{ checkState === "checking" ? "Checking…" : "Check ✓" }}
        </button>
        <span
          v-if="checkState === 'pass'"
          class="cn-tut__verdict cn-tut__verdict--pass"
          >Passed! 🎉</span
        >
        <span
          v-else-if="checkState === 'fail'"
          class="cn-tut__verdict cn-tut__verdict--fail"
          >Not yet{{ checkMsg ? ": " + checkMsg : "" }}</span
        >
        <button
          v-if="checkState === 'pass' && stepIndex < total - 1"
          class="cn-tut__btn cn-tut__btn--next"
          @click="goto(stepIndex + 1)"
        >
          Next →
        </button>
      </div>
      <div class="cn-tut__panes">
        <div class="cn-tut__editor" ref="editorHost"></div>
        <div class="cn-tut__right">
          <div class="cn-tut__tabs">
            <button :class="{ on: tab === 'preview' }" @click="tab = 'preview'">
              Preview
            </button>
            <button
              :class="{ on: tab === 'compiled' }"
              @click="tab = 'compiled'"
            >
              Compiled
            </button>
            <button :class="{ on: tab === 'js' }" @click="tab = 'js'">
              JS
            </button>
          </div>
          <div class="cn-tut__preview" v-show="tab === 'preview'">
            <iframe
              ref="iframe"
              title="Tutorial preview"
              sandbox="allow-scripts allow-same-origin allow-modals"
            ></iframe>
            <div class="cn-tut__console" v-if="logs.length">
              <div
                v-for="(l, i) in logs"
                :key="i"
                :class="`cn-tut__log cn-tut__log--${l.level}`"
              >
                {{ l.text }}
              </div>
            </div>
          </div>
          <pre
            v-show="tab === 'compiled'"
            class="cn-tut__out"
          ><code>{{ compiledOut || "// Run, then open this tab" }}</code></pre>
          <pre
            v-show="tab === 'js'"
            class="cn-tut__out"
          ><code>{{ jsOut || "// Run, then open this tab" }}</code></pre>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Full-bleed, app-like: break out of the page container to the viewport and
   fill the height under the nav — the Solid tutorial layout. */
.cn-tut {
  display: grid;
  grid-template-columns: 360px 1fr;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  height: calc(100vh - var(--vp-nav-height, 64px));
  align-items: stretch;
  overflow: hidden;
}
.cn-tut__task {
  border-right: 1px solid var(--vp-c-divider);
  padding: 20px 20px 32px;
  background: var(--vp-c-bg-alt);
  overflow-y: auto;
}
.cn-tut__tracks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.cn-tut__tracklink {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2) !important;
  text-decoration: none !important;
}
.cn-tut__tracklink:hover {
  border-color: var(--vp-c-brand-1);
}
.cn-tut__tracklink--on {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff !important;
}
.cn-tut__crumbs {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.cn-tut__track {
  font-weight: 700;
  color: var(--vp-c-brand-1);
}
.cn-tut__bar {
  height: 5px;
  border-radius: 3px;
  background: var(--vp-c-default-soft);
  margin: 8px 0 12px;
  overflow: hidden;
}
.cn-tut__bar-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  transition: width 0.3s;
}
.cn-tut__steps {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  font-size: 13px;
}
.cn-tut__steps li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--vp-c-text-2);
}
.cn-tut__steps li:hover {
  background: var(--vp-c-default-soft);
}
.cn-tut__step--on {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1) !important;
  font-weight: 600;
}
.cn-tut__tick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 11px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
.cn-tut__step--done .cn-tut__tick {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.cn-tut__badge {
  text-align: center;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    var(--vp-c-brand-soft),
    var(--vp-c-default-soft)
  );
  border: 1px solid var(--vp-c-brand-1);
}
.cn-tut__medal {
  font-size: 40px;
  line-height: 1;
}
.cn-tut__badge strong {
  display: block;
  margin: 6px 0 2px;
}
.cn-tut__badge p {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin: 0 0 10px;
}
.cn-tut__badge button {
  font-size: 13px;
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
}
.cn-tut__prose {
  font-size: 14px;
  line-height: 1.6;
}
.cn-tut__prose :deep(code) {
  font-size: 12px;
}
.cn-tut__nudges {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.cn-tut__nudges button {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  cursor: pointer;
}
.cn-tut__hint {
  font-size: 13px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}
.cn-tut__work {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--vp-c-bg-alt);
  min-width: 0;
}
.cn-tut__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex: 0 0 auto;
}
.cn-tut__btn {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.cn-tut__btn--run {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.cn-tut__btn--check {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}
.cn-tut__btn--next {
  margin-left: auto;
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.cn-tut__verdict {
  font-size: 13px;
  font-weight: 600;
}
.cn-tut__verdict--pass {
  color: var(--vp-c-brand-1);
}
.cn-tut__verdict--fail {
  color: var(--vp-c-warning-1);
}
.cn-tut__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1 1 auto;
  min-height: 0;
}
.cn-tut__editor {
  overflow: auto;
  border-right: 1px solid var(--vp-c-divider);
  min-height: 0;
}
.cn-tut__editor :deep(.cm-editor) {
  height: 100%;
  font-size: 13px;
}
.cn-tut__right {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.cn-tut__tabs {
  display: flex;
  gap: 2px;
  padding: 4px 6px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.cn-tut__tabs button {
  font-size: 12px;
  padding: 5px 12px;
  border: 0;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.cn-tut__tabs button.on {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.cn-tut__preview {
  display: flex;
  flex-direction: column;
  background: #fff;
  flex: 1;
}
.cn-tut__preview iframe {
  flex: 1;
  border: 0;
  width: 100%;
  min-height: 200px;
}
.cn-tut__console {
  border-top: 1px solid var(--vp-c-divider);
  max-height: 120px;
  overflow: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}
.cn-tut__log {
  padding: 3px 10px;
  white-space: pre-wrap;
  color: var(--vp-c-text-2);
}
.cn-tut__log--error {
  color: var(--vp-c-danger-1);
}
.cn-tut__out {
  flex: 1;
  margin: 0;
  padding: 12px 14px;
  overflow: auto;
  min-height: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
}
@media (max-width: 860px) {
  .cn-tut {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
  .cn-tut__task {
    overflow-y: visible;
    border-right: 0;
    border-bottom: 1px solid var(--vp-c-divider);
  }
  .cn-tut__panes {
    grid-template-columns: 1fr;
  }
  .cn-tut__editor {
    border-right: 0;
    border-bottom: 1px solid var(--vp-c-divider);
    min-height: 320px;
  }
  .cn-tut__preview iframe {
    min-height: 260px;
  }
}
</style>
