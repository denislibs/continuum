import { stream, wire, type Wire } from "@continuum-js/frp";
import { Show, Each, bindInput } from "@continuum-js/dom";

export interface Todo {
  id: number;
  text: string;
}

/**
 * A small keyed list demo exercising at/accum, the `<Each>` and `<Show>`
 * components, and a controlled input via `bindInput`. All dynamics flow
 * through the network.
 */
export function TodoApp() {
  let nextId = 1;
  const draft = wire("");
  const submit = stream<void>();

  const todos: Wire<Todo[]> = draft
    .at(submit, (text) => text.trim())
    .filter((text) => text.length > 0)
    .accum<Todo[]>([], (text, list) => [...list, { id: nextId++, text }]);

  const hasItems = todos.map((list) => list.length > 0);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    submit.fire();
    draft.set("");
  };

  return (
    <form onSubmit={onSubmit}>
      <input placeholder="what to do?" {...bindInput(draft, draft.set)} />
      <Show when={hasItems} fallback={() => <p class="empty">nothing yet</p>}>
        {() => (
          <ul>
            <Each each={todos} by={(t) => t.id}>
              {(t) => <li>{t.text}</li>}
            </Each>
          </ul>
        )}
      </Show>
    </form>
  );
}
