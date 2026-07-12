// Tutorial data model. A track is an ordered list of steps; each step is a
// self-contained exercise with starter code, a reference solution, and a
// check that decides whether the learner's code satisfies the goal.
//
// IMPORTANT: `check` must be closure-free — it may reference ONLY its `ctx`
// argument. The live tutorial serializes it with `.toString()` and evals it
// inside the sandboxed iframe, where the real @continuum-js/test utilities and
// the learner's component are injected as `ctx`. Any captured variable would
// be undefined there.

export interface CheckCtx {
  /** The learner's default export (a component: () => Node). */
  App: () => Node;
  /** Mount a view into a fresh detached container (from @continuum-js/test). */
  render: (view: () => unknown) => {
    container: HTMLElement;
    dispose: () => void;
  };
  click: (el: EventTarget) => boolean;
  type: (input: HTMLInputElement, text: string) => void;
  fire: (el: EventTarget, event: Event) => boolean;
  flush: (rounds?: number) => Promise<void>;
  cleanup: () => void;
}

export interface Step {
  id: string;
  title: string;
  /** Markdown/HTML task description shown beside the editor. */
  task: string;
  /** Code the editor opens with. */
  starter: string;
  /** Reference solution ("Show solution" reveals it). */
  solution: string;
  /** Optional nudge shown before the full solution. */
  hint?: string;
  /** Passes/fails the learner's code. Closure-free — see the module note. */
  check: (ctx: CheckCtx) => boolean | Promise<boolean>;
}

export interface Track {
  id: string;
  title: string;
  blurb: string;
  steps: Step[];
}
