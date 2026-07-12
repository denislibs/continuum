// Custom VitePress theme: extends the default and registers the interactive
// Playground so any page (or the tutorial) can drop <Playground> in Markdown.
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Playground from "./playground/Playground.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Playground", Playground);
  },
} satisfies Theme;
