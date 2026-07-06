import { newBehavior } from "@continuum-js/frp";
import { Dynamic, Show, Portal } from "@continuum-js/dom";

type Tab = "home" | "about";

/**
 * Showcases the control-flow components:
 * - `<Dynamic>` switches the tab panel by value,
 * - `<Show>` + `<Portal>` render a modal into `document.body` and tear it down.
 */
export function Showcase() {
  const [tab, setTab] = newBehavior<Tab>("home");
  const [modalOpen, setModalOpen] = newBehavior(false);

  return (
    <div class="showcase">
      <nav>
        <button class="tab-home" onClick={() => setTab("home")}>
          Home
        </button>
        <button class="tab-about" onClick={() => setTab("about")}>
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

      <button class="open" onClick={() => setModalOpen(true)}>
        Open modal
      </button>

      <Show when={modalOpen}>
        {() => (
          <Portal mount={document.body}>
            <div class="modal">
              <p>Rendered through a Portal into &lt;body&gt;.</p>
              <button class="close" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  );
}
