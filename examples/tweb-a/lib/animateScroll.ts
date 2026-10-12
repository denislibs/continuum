// Port of telegram-tt's animateScroll without fasterdom: the initial read
// is a measure (frame pass, before writes), the glide is one scrollTop
// write per animation frame — a write never forces layout.
import { requestMeasure } from "@continuum-js/frp";

const running = new WeakMap<Element, number>();

const easeOutQuad = (t: number) => t * (2 - t);

export function animateScroll(
  el: Element,
  to: number,
  durationMs: number,
  onDone?: () => void,
): void {
  const prev = running.get(el);
  if (prev !== undefined) cancelAnimationFrame(prev);
  requestMeasure(() => {
    const from = el.scrollTop;
    if (durationMs <= 0 || from === to) {
      el.scrollTop = to;
      onDone?.();
      return;
    }
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      el.scrollTop = from + (to - from) * easeOutQuad(t);
      if (t < 1) running.set(el, requestAnimationFrame(step));
      else {
        running.delete(el);
        onDone?.();
      }
    };
    running.set(el, requestAnimationFrame(step));
  });
}
