import { defineConfig } from "vitepress";

// Deployed as a GitHub Pages project site: https://denislibs.github.io/continuum/
export default defineConfig({
  title: "Continuum",
  base: "/continuum/",
  lastUpdated: true,

  locales: {
    root: {
      label: "English",
      lang: "en",
      description:
        "Classic FRP for the DOM: Behaviors, Events, and fine-grained rendering with no re-renders.",
      themeConfig: {
        nav: [{ text: "Tutorial", link: "/tutorial/thinking-in-frp" }],
        sidebar: [
          {
            text: "Tutorial",
            items: [
              {
                text: "Thinking in Behaviors and Events",
                link: "/tutorial/thinking-in-frp",
              },
            ],
          },
        ],
        editLink: {
          pattern: "https://github.com/denislibs/continuum/edit/main/docs/:path",
          text: "Edit this page on GitHub",
        },
      },
    },
    ru: {
      label: "Русский",
      lang: "ru",
      description:
        "Классический FRP для DOM: Behaviors, Events и тонкозернистый рендеринг без ре-рендеров.",
      themeConfig: {
        nav: [{ text: "Туториал", link: "/ru/tutorial/thinking-in-frp" }],
        sidebar: [
          {
            text: "Туториал",
            items: [
              {
                text: "Мышление в Behaviors и Events",
                link: "/ru/tutorial/thinking-in-frp",
              },
            ],
          },
        ],
        editLink: {
          pattern: "https://github.com/denislibs/continuum/edit/main/docs/:path",
          text: "Править на GitHub",
        },
        outline: { label: "На этой странице" },
        docFooter: { prev: "Назад", next: "Вперёд" },
        lastUpdated: { text: "Обновлено" },
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/denislibs/continuum" },
      { icon: "npm", link: "https://www.npmjs.com/org/continuum-js" },
    ],
    search: { provider: "local" },
  },
});
