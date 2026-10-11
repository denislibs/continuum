// What forces style/layout when read or called — Paul Irish's list
// (https://gist.github.com/paulirish/5d52fb081b3570c81e3a), as used by
// Telegram's teact `stricterdom`. Keyed by global name; `props` are getters,
// `methods` are calls. Entries missing on a platform are skipped.
export const LAYOUT_CAUSES = {
  Element: {
    props: [
      "clientLeft",
      "clientTop",
      "clientWidth",
      "clientHeight",
      "scrollWidth",
      "scrollHeight",
      "scrollLeft",
      "scrollTop",
    ],
    methods: [
      "getClientRects",
      "getBoundingClientRect",
      "scrollBy",
      "scrollTo",
      "scrollIntoView",
      "scrollIntoViewIfNeeded",
    ],
  },
  HTMLElement: {
    props: [
      "offsetLeft",
      "offsetTop",
      "offsetWidth",
      "offsetHeight",
      "offsetParent",
      "innerText",
    ],
    methods: ["focus"],
  },
  window: {
    props: ["scrollX", "scrollY", "innerHeight", "innerWidth"],
    methods: ["getComputedStyle"],
  },
  VisualViewport: {
    props: ["height", "width", "offsetTop", "offsetLeft"],
    methods: [],
  },
  Document: {
    props: ["scrollingElement"],
    methods: ["elementFromPoint"],
  },
  HTMLInputElement: {
    props: [],
    methods: ["select"],
  },
  MouseEvent: {
    props: ["layerX", "layerY", "offsetX", "offsetY"],
    methods: [],
  },
  Range: {
    props: [],
    methods: ["getClientRects", "getBoundingClientRect"],
  },
} as const satisfies Record<
  string,
  { props: readonly string[]; methods: readonly string[] }
>;
