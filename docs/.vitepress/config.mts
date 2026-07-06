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
        nav: [
          { text: "Tutorial", link: "/tutorial/thinking-in-frp" },
          { text: "From React", link: "/from-react" },
        ],
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
          {
            text: "Guides",
            items: [
              { text: "State and derived values", link: "/guides/state" },
              { text: "Lists", link: "/guides/lists" },
              { text: "Async", link: "/guides/async" },
              { text: "Forms", link: "/guides/forms" },
            ],
          },
          {
            text: "Migration",
            items: [{ text: "From React", link: "/from-react" }],
          },
        ],
        editLink: {
          pattern:
            "https://github.com/denislibs/continuum/edit/main/docs/:path",
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
        nav: [
          { text: "Туториал", link: "/ru/tutorial/thinking-in-frp" },
          { text: "Из React", link: "/ru/from-react" },
        ],
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
          {
            text: "Гайды",
            items: [
              {
                text: "Состояние и производные значения",
                link: "/ru/guides/state",
              },
              { text: "Списки", link: "/ru/guides/lists" },
              { text: "Асинхронность", link: "/ru/guides/async" },
              { text: "Формы", link: "/ru/guides/forms" },
            ],
          },
          {
            text: "Миграция",
            items: [{ text: "Из React", link: "/ru/from-react" }],
          },
        ],
        editLink: {
          pattern:
            "https://github.com/denislibs/continuum/edit/main/docs/:path",
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
