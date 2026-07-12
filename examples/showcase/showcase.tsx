import { state } from "@continuum-js/frp";
import { Dynamic, Show, Portal } from "@continuum-js/dom";

type Tab = "home" | "about";

/**
 * Showcases the control-flow components:
 * - `<Dynamic>` switches the tab panel by value,
 * - `<Show>` + `<Portal>` render a modal into `document.body` and tear it down.
 */
export function Showcase() {
  const tab = state<Tab>("home");
  const modalOpen = state(false);

  return (
    <div class="showcase">
      <nav>
        <button class="tab-home" onClick={() => tab.set("home")}>
          Home
        </button>
        <button class="tab-about" onClick={() => tab.set("about")}>
          About
        </button>
      </nav>

      <Dynamic value={tab}>
        {(t) =>
          t === "home" ? (
            <p class="panel">🏠 Welcome home</p>
          ) : (
            <p class="panel">ℹ️ About Continuum</p>
          )
        }
      </Dynamic>

      <button class="open" onClick={() => modalOpen.set(true)}>
        Open modal
      </button>

      <Show when={modalOpen}>
        {() => (
          <Portal mount={document.body}>
            <div class="modal">
              <p>Rendered through a Portal into &lt;body&gt;.</p>
              <button class="close" onClick={() => modalOpen.set(false)}>
                Close
              </button>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  );
}
