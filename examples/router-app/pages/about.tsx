// This module is loaded through `lazy(() => import("./pages/about.js"))`,
// so the bundler ships it as a separate chunk.

export default function About() {
  return (
    <article>
      <h2>About</h2>
      <p>This page arrived as its own chunk, fetched on first visit.</p>
    </article>
  );
}
