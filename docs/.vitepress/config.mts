import { defineConfig, type DefaultTheme } from "vitepress";

// Deployed as a GitHub Pages project site: https://denislibs.github.io/continuum/

// One learning path, Solid/Angular-style: Introduction → Concepts → Guides →
// Migration. Both locales mirror the same tree.
function sidebar(
  prefix: "" | "/ru",
  t: Record<string, string>,
): DefaultTheme.Sidebar {
  return [
    {
      text: t.introduction,
      items: [
        { text: t.overview, link: `${prefix}/overview` },
        { text: t.history, link: `${prefix}/history` },
        { text: t.quickStart, link: `${prefix}/quick-start` },
        { text: t.tutorial, link: `${prefix}/tutorial/thinking-in-frp` },
      ],
    },
    {
      text: t.concepts,
      items: [
        { text: t.components, link: `${prefix}/concepts/components` },
        { text: "Behaviors", link: `${prefix}/concepts/behaviors` },
        { text: "Events", link: `${prefix}/concepts/events` },
        { text: t.transactions, link: `${prefix}/concepts/transactions` },
        {
          text: t.conditional,
          link: `${prefix}/concepts/conditional-rendering`,
        },
        { text: t.lists, link: `${prefix}/concepts/list-rendering` },
        { text: t.ownership, link: `${prefix}/concepts/ownership` },
        { text: t.context, link: `${prefix}/concepts/context` },
      ],
    },
    {
      text: t.guides,
      items: [
        { text: t.state, link: `${prefix}/guides/state` },
        { text: t.async, link: `${prefix}/guides/async` },
        { text: t.forms, link: `${prefix}/guides/forms` },
        { text: t.routing, link: `${prefix}/guides/routing` },
      ],
    },
    {
      text: t.migration,
      items: [{ text: t.fromReact, link: `${prefix}/from-react` }],
    },
  ];
}

const en = {
  introduction: "Introduction",
  overview: "Overview",
  history: "History and context",
  quickStart: "Quick start",
  tutorial: "Thinking in Behaviors and Events",
  concepts: "Concepts",
  components: "Components",
  transactions: "Transactions and time",
  conditional: "Conditional rendering",
  lists: "List rendering",
  ownership: "Ownership and lifecycle",
  context: "Context",
  guides: "Guides",
  state: "State and derived values",
  async: "Async",
  forms: "Forms",
  routing: "Routing",
  migration: "Migration",
  fromReact: "From React",
};

const ru = {
  introduction: "Введение",
  overview: "Обзор",
  history: "История и контекст",
  quickStart: "Быстрый старт",
  tutorial: "Мышление в Behaviors и Events",
  concepts: "Понятия",
  components: "Компоненты",
  transactions: "Транзакции и время",
  conditional: "Условный рендеринг",
  lists: "Списки",
  ownership: "Владение и жизненный цикл",
  context: "Контекст",
  guides: "Гайды",
  state: "Состояние и производные значения",
  async: "Асинхронность",
  forms: "Формы",
  routing: "Роутинг",
  migration: "Миграция",
  fromReact: "Из React",
};

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
          { text: "Learn", link: "/overview" },
          { text: "From React", link: "/from-react" },
        ],
        sidebar: sidebar("", en),
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
          { text: "Учиться", link: "/ru/overview" },
          { text: "Из React", link: "/ru/from-react" },
        ],
        sidebar: sidebar("/ru", ru),
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
