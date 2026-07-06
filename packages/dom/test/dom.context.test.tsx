import { describe, test, expect } from "vitest";
import {
  h,
  mount,
  dyn,
  createContext,
  provide,
  use,
  when,
  bindInput,
  portal,
} from "@continuum-js/dom";
import { newBehavior, constant } from "@continuum-js/frp";

describe("context", () => {
  test("use falls back to the default when nothing is provided", () => {
    const Theme = createContext("light");
    let seen = "";
    function Leaf() {
      seen = use(Theme);
      return <span>{seen}</span>;
    }
    const container = document.createElement("div");
    mount(container, () => (
      <div>
        <Leaf />
      </div>
    ));
    expect(seen).toBe("light");
  });

  test("use reads the nearest provided value up the owner tree", () => {
    const Theme = createContext("light");
    const results: string[] = [];
    function Leaf() {
      results.push(use(Theme));
      return <span />;
    }
    const container = document.createElement("div");
    mount(container, () => {
      provide(Theme, "outer");
      return (
        <div>
          <Leaf />
          {dyn(constant(1), () => {
            provide(Theme, "inner");
            return <Leaf />;
          })}
        </div>
      );
    });
    expect(results).toEqual(["outer", "inner"]);
  });

  test("carries a reactive object down the tree", () => {
    const ThemeCtx = createContext(constant("light"));
    let node: HTMLElement | null = null;
    function Leaf() {
      const theme = use(ThemeCtx);
      node = (<span>{theme}</span>) as HTMLElement;
      return node;
    }
    const [theme, setTheme] = newBehavior("dark");
    const container = document.createElement("div");
    mount(container, () => {
      provide(ThemeCtx, theme);
      return <Leaf />;
    });
    expect(node!.textContent).toBe("dark");
    setTheme("solarized");
    expect(node!.textContent).toBe("solarized"); // dynamics flow through the Behavior
  });
});

describe("when", () => {
  test("shows the then/else branch and does not rebuild on same value", () => {
    const [cond, set] = newBehavior(true);
    let thenRenders = 0;
    const container = document.createElement("div");
    mount(container, () =>
      when(
        cond,
        () => {
          thenRenders++;
          return <span>yes</span>;
        },
        () => <span>no</span>
      )
    );
    expect(container.textContent).toBe("yes");
    expect(thenRenders).toBe(1);
    set(true); // same value -> no rebuild
    expect(thenRenders).toBe(1);
    set(false);
    expect(container.textContent).toBe("no");
    set(true);
    expect(container.textContent).toBe("yes");
    expect(thenRenders).toBe(2);
  });
});

describe("bindInput", () => {
  test("two-way binds a text input", () => {
    const [text, setText] = newBehavior("hi");
    const input = (<input {...bindInput(text, setText)} />) as HTMLInputElement;
    expect(input.value).toBe("hi");
    input.value = "world";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    expect(text.sample()).toBe("world");
  });
});

describe("portal", () => {
  test("renders into another node and cleans up", () => {
    const target = document.createElement("div");
    const container = document.createElement("div");
    const unmount = mount(container, () => portal(target, <span>hi</span>));
    expect(target.textContent).toBe("hi");
    expect(container.textContent).toBe(""); // only a placeholder comment
    unmount();
    expect(target.textContent).toBe("");
  });
});
