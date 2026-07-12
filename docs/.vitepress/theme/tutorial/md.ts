// A deliberately tiny Markdown subset for tutorial task text: paragraphs,
// **bold**, and `inline code`. Input is escaped first, so even though the
// output is used with v-html it cannot inject markup — and task text is
// authored by us, not the learner. No dependency, no full parser.

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderTask(md: string): string {
  return md
    .split(/\n\s*\n/)
    .map((block) => `<p>${inline(escapeHtml(block.trim()))}</p>`)
    .join("");
}
