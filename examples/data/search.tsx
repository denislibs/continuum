import { wire } from "@continuum-js/frp";
import { bindInput, Dynamic, type Child } from "@continuum-js/dom";
import { resource, debounce } from "@continuum-js/std";

export interface User {
  id: number;
  login: string;
}

/**
 * Live "search users as you type" — the canonical real-world data flow:
 * input → debounce → HTTP request → loading/error/empty/results.
 *
 * The `search` fetcher is injected so the component is trivially testable and
 * backend-agnostic; `main.tsx` wires it to the real GitHub API.
 */
export function UserSearch({
  search,
}: {
  search: (query: string) => Promise<User[]>;
}) {
  const draft = wire("");

  // keystrokes → quiet 300 ms → non-empty query
  const query = debounce(draft.updates, 300)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const state = resource(query, search);

  return (
    <div class="user-search">
      <input
        placeholder="search GitHub users…"
        {...bindInput(draft, draft.set)}
      />
      <Dynamic value={state}>
        {(s): Child => {
          if (s.status === "loading") return <p class="loading">searching…</p>;
          if (s.status === "error") return <p class="error">request failed</p>;
          if (s.status === "ok")
            return s.value.length === 0 ? (
              <p class="empty">no users found</p>
            ) : (
              <ul>
                {s.value.map((u) => (
                  <li>{u.login}</li>
                ))}
              </ul>
            );
          return <p class="hint">type to search</p>; // idle
        }}
      </Dynamic>
    </div>
  );
}
