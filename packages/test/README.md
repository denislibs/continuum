# @continuum-js/test

Test utilities for [Continuum](https://denislibs.github.io/continuum/) apps on top of jsdom/vitest.

```tsx
import { render, click, type, flush, cleanup } from "@continuum-js/test";

const { getByText } = render(() => <Counter />);
click(getByText("+1"));
expect(getByText("count: 1")).toBeTruthy();
```

- `render(view)` mounts under a disposable root and returns queries + `unmount`.
- `click`/`type`/`fire` drive events through the real delegation path and
  run the frame pass, so the DOM is updated when they return.
- `advanceTimers`/`flush` settle debounce/resource pipelines deterministically.
- `flushFrame()` (re-exported from frp) runs the pass after a direct `set`/`fire`
  in a test, before reading the DOM or a listener's log.
- `cleanup()` disposes everything between tests (wire it to `afterEach`).

Docs: https://denislibs.github.io/continuum/
