// Custom VitePress theme: extends the default and registers the interactive
// Playground so any page (or the tutorial) can drop <Playground> in Markdown.
//
// Playground is async so its heavy deps (@babel/standalone, CodeMirror) split
// into a chunk loaded only on pages that actually render a playground — the
// rest of the docs stay light.
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { defineAsyncComponent } from "vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component(
      "Playground",
      defineAsyncComponent(() => import("./playground/Playground.vue")),
    );
  },
} satisfies Theme;
