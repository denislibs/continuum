import { defineConfig, type DefaultTheme } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

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
        { text: t.plainWords, link: `${prefix}/frp-in-plain-words` },
        { text: t.quickStart, link: `${prefix}/quick-start` },
        { text: t.examples, link: `${prefix}/examples` },
        { text: t.glossary, link: `${prefix}/glossary` },
      ],
    },
    {
      text: t.concepts,
      items: [
        { text: t.components, link: `${prefix}/concepts/components` },
        { text: "Behaviors", link: `${prefix}/concepts/behaviors` },
        { text: "Events", link: `${prefix}/concepts/events` },
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
        { text: t.animation, link: `${prefix}/guides/animation` },
        { text: t.patterns, link: `${prefix}/guides/patterns` },
        { text: t.composables, link: `${prefix}/guides/composables` },
        { text: t.mistakes, link: `${prefix}/guides/common-mistakes` },
      ],
    },
    {
      text: t.migration,
      items: [
        { text: t.fromReact, link: `${prefix}/from-react` },
        { text: t.fromRxjs, link: `${prefix}/from-rxjs` },
      ],
    },
    {
      // The engine room: read when you want to know WHY it works.
      text: t.deeper,
      items: [
        { text: t.tutorial, link: `${prefix}/tutorial/thinking-in-frp` },
        { text: t.transactions, link: `${prefix}/concepts/transactions` },
        { text: t.history, link: `${prefix}/history` },
      ],
    },
    {
      // Generated from JSDoc (npm run docs:api) — English only, shared by
      // both locales.
      text: t.reference,
      collapsed: true,
      items: [
        { text: "@continuum-js/frp", link: "/reference/frp/" },
        { text: "@continuum-js/dom", link: "/reference/dom/" },
        { text: "@continuum-js/std", link: "/reference/std/" },
        { text: "@continuum-js/router", link: "/reference/router/" },
        { text: "@continuum-js/test", link: "/reference/test/" },
      ],
    },
  ];
}

const en = {
  introduction: "Introduction",
  overview: "Overview",
  plainWords: "What is FRP — in plain words",
  history: "History and context",
  glossary: "Glossary",
  examples: "Examples",
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
  animation: "Animation",
  patterns: "Patterns",
  composables: "Your own composables",
  mistakes: "Common mistakes",
  migration: "Migration",
  fromReact: "From React",
  fromRxjs: "From RxJS",
  reference: "API Reference",
  deeper: "Under the hood",
};

const ru = {
  introduction: "Введение",
  overview: "Обзор",
  plainWords: "Что такое FRP — на пальцах",
  history: "История и контекст",
  glossary: "Глоссарий",
  examples: "Примеры",
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
  animation: "Анимация",
  patterns: "Паттерны",
  composables: "Свои композаблы",
  mistakes: "Частые ошибки",
  migration: "Миграция",
  fromReact: "Из React",
  fromRxjs: "Из RxJS",
  reference: "Справочник API",
  deeper: "Под капотом",
};

export default defineConfig({
  title: "Continuum",
  base: "/continuum/",
  lastUpdated: true,

  vite: {
    plugins: [
      // llms.txt + llms-full.txt + a raw .md twin of every page, so AI
      // assistants can ingest the docs without HTML noise. English only —
      // the ru locale mirrors it and would double the tokens.
      llmstxt({
        // The plugin appends the site base itself — domain only.
        domain: "https://denislibs.github.io",
        ignoreFiles: ["ru/**"],
      }),
    ],
  },

  locales: {
    root: {
      label: "English",
      lang: "en",
      description:
        "Reactive UI with no re-renders: pinpoint DOM updates on a classic-FRP foundation.",
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
        "Реактивный UI без ре-рендеров: точечные обновления DOM на фундаменте классического FRP.",
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
