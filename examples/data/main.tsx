import { mount } from "@continuum/dom";
import { UserSearch, type User } from "./search";

// Real IO lives at the edge: a plain async function hitting the GitHub API.
// Everything inside the component treats it as an injected dependency.
async function searchGitHub(query: string): Promise<User[]> {
  const res = await fetch(
    `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=10`
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = (await res.json()) as { items: User[] };
  return data.items;
}

mount(document.getElementById("app")!, () => (
  <UserSearch search={searchGitHub} />
));
