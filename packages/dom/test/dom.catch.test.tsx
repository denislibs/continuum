import { describe, test, expect, afterEach } from "vitest";
import { mount, Catch, Show, onCleanup } from "@continuum-js/dom";
import { state } from "@continuum-js/frp";

let unmounts: Array<() => void> = [];
afterEach(() => {
  for (const u of unmounts) u();
  unmounts = [];
});

function render(view: () => Node): HTMLElement {
  const container = document.createElement("div");
  unmounts.push(mount(container, view));
  return container;
}

describe("<Catch>", () => {
  test("renders children when nothing throws", () => {
    const container = render(() => (
      <Catch fallback={() => <p class="err">fail</p>}>
        {() => <p class="ok">fine</p>}
      </Catch>
    ));
    expect(container.querySelector(".ok")).not.toBeNull();
    expect(container.querySelector(".err")).toBeNull();
  });

  test("build-phase error shows the fallback with the error", () => {
    const container = render(() => (
      <Catch fallback={(e) => <p class="err">{String(e)}</p>}>
        {() => {
          throw new Error("boom");
        }}
      </Catch>
    ));
    expect(container.querySelector(".err")).not.toBeNull();
    expect(container.textContent).toContain("boom");
  });

  test("reset re-renders the children", () => {
    let broken = true;
    let doReset: () => void = () => {};
    const container = render(() => (
      <Catch
        fallback={(_e, reset) => {
          doReset = reset;
          return <p class="err">fail</p>;
        }}
      >
        {() => {
          if (broken) throw new Error("boom");
          return <p class="ok">recovered</p>;
        }}
      </Catch>
    ));
    expect(container.querySelector(".err")).not.toBeNull();
    broken = false;
    doReset();
    expect(container.querySelector(".ok")).not.toBeNull();
    expect(container.querySelector(".err")).toBeNull();
  });

  test("an error in a nested dynamic region trips the boundary", () => {
    const show = state(false);
    const setShow = show.set;
    const container = render(() => (
      <Catch fallback={() => <p class="err">fail</p>}>
        {() => (
          <div>
            <Show when={show}>
              {() => {
                throw new Error("late boom");
              }}
            </Show>
            <p class="ok">before</p>
          </div>
        )}
      </Catch>
    ));
    expect(container.querySelector(".ok")).not.toBeNull();
    setShow(true);
    expect(container.querySelector(".err")).not.toBeNull();
    expect(container.querySelector(".ok")).toBeNull(); // subtree replaced
  });

  test("switching to the fallback disposes the children's ownership", () => {
    const show = state(false);
    const setShow = show.set;
    let cleaned = 0;
    render(() => (
      <Catch fallback={() => <p class="err">fail</p>}>
        {() => {
          onCleanup(() => cleaned++);
          return (
            <Show when={show}>
              {() => {
                throw new Error("late boom");
              }}
            </Show>
          );
        }}
      </Catch>
    ));
    expect(cleaned).toBe(0);
    setShow(true);
    expect(cleaned).toBe(1);
  });

  test("partial build is cleaned up after a mid-build throw", () => {
    let cleaned = 0;
    render(() => (
      <Catch fallback={() => <p class="err">fail</p>}>
        {() => {
          onCleanup(() => cleaned++); // registered before the throw
          throw new Error("boom");
        }}
      </Catch>
    ));
    expect(cleaned).toBe(1);
  });

  test("an error in the fallback escalates to the outer boundary", () => {
    const container = render(() => (
      <Catch fallback={() => <p class="outer-err">outer</p>}>
        {() => (
          <Catch
            fallback={() => {
              throw new Error("fallback boom");
            }}
          >
            {() => {
              throw new Error("boom");
            }}
          </Catch>
        )}
      </Catch>
    ));
    expect(container.querySelector(".outer-err")).not.toBeNull();
  });

  test("without a boundary a dynamic-region error still throws", () => {
    const show = state(false);
    const setShow = show.set;
    render(() => (
      <Show when={show}>
        {() => {
          throw new Error("unguarded");
        }}
      </Show>
    ));
    expect(() => setShow(true)).toThrow("unguarded");
  });
});
