// Custom VitePress theme: extends the default and registers the interactive
// Playground so any page (or the tutorial) can drop <Playground> in Markdown.
//
// Playground is async so its heavy deps (@babel/standalone, CodeMirror) split
// into a chunk loaded only on pages that actually render a playground — the
// rest of the docs stay light.
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { defineAsyncComponent, watch, nextTick } from "vue";
import { useRoute } from "vitepress";
import { attachRunButtons } from "./runButtons";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component(
      "Playground",
      defineAsyncComponent(() => import("./playground/Playground.vue")),
    );
    app.component(
      "Tutorial",
      defineAsyncComponent(() => import("./tutorial/Tutorial.vue")),
    );
  },
  setup() {
    const route = useRoute();
    const base = import.meta.env.BASE_URL;
    // Re-scan after each navigation once the new page's DOM is in place.
    watch(
      () => route.path,
      () => nextTick(() => attachRunButtons(base)),
      { immediate: true },
    );
  },
} satisfies Theme;
