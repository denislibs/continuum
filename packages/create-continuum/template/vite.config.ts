/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import continuum from "@continuum-js/vite-plugin";

export default defineConfig({
  // The optional JSX compiler — on by default for Solid-class create
  // performance. Remove the plugin and the same code runs through the
  // runtime factory unchanged (see the "Compiler" guide).
  plugins: [continuum()],
  test: {
    environment: "jsdom",
  },
});
