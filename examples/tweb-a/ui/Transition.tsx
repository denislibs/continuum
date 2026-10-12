// Port of telegram-tt's <Transition>: slide/fade/zoom between `activeKey`
// values. Both layers live in the DOM while the CSS transition runs — the
// leaving layer keeps its bindings until `transitionend` — and the switch
// counts as a heavy animation, so lists under `holdWhile` stand still.
import { type State } from "@continuum-js/frp";
import { scope, onCleanup, type Child } from "@continuum-js/dom";
import { beginHeavyAnimation } from "@continuum-js/dom/layout";

export const TRANSITION_MS = 300;
const END_DELAY_MS = 50;

type Layer = { el: HTMLElement; dispose: () => void };

export function Transition(props: {
  activeKey: State<number>;
  name: "slide" | "fade" | "zoom-fade" | "none";
  className?: string;
  children: (key: number) => Child;
}): HTMLElement {
  const container = (
    <div
      class={["Transition", props.name, props.className]
        .filter(Boolean)
        .join(" ")}
    />
  ) as HTMLElement;
  let active: Layer | null = null;
  const leaving = new Set<Layer>();

  const build = (key: number, cls: string): Layer => {
    const el = (<div class={`Transition_slide ${cls}`} />) as HTMLElement;
    const { dispose } = scope(() => {
      el.append(props.children(key) as Node);
    });
    return { el, dispose };
  };

  onCleanup(
    props.activeKey.listen((key) => {
      const next = build(
        key,
        active ? "Transition_slide-to" : "Transition_slide-active",
      );
      container.append(next.el);
      const old = active;
      active = next;
      if (!old) return;
      // a layer still entering when superseded never finished: drop it now
      if (old.el.classList.contains("Transition_slide-to")) {
        old.el.remove();
        old.dispose();
      } else {
        leaving.add(old);
        const end = beginHeavyAnimation(TRANSITION_MS + END_DELAY_MS);
        old.el.classList.replace(
          "Transition_slide-active",
          "Transition_slide-from",
        );
        old.el.addEventListener(
          "transitionend",
          () => {
            leaving.delete(old);
            old.el.remove();
            old.dispose();
            end();
          },
          { once: true },
        );
      }
      // next frame: flip the class so the CSS transition actually runs
      requestAnimationFrame(() =>
        next.el.classList.replace(
          "Transition_slide-to",
          "Transition_slide-active",
        ),
      );
    }),
  );
  onCleanup(() => {
    active?.dispose();
    for (const l of leaving) l.dispose();
  });
  return container;
}
