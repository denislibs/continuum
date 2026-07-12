// Adds a "Run" button to every tsx/jsx code block in the docs. The button
// links to the playground with the block's code packed into the URL fragment
// (the playground restores it on load) — so any snippet in the docs is one
// click from being live and editable. No per-page inline runtime.
import { encodeCode } from "./playground/share";

export function attachRunButtons(base: string): void {
  if (typeof document === "undefined") return;
  const blocks = document.querySelectorAll<HTMLElement>(
    '.vp-doc div[class*="language-tsx"], .vp-doc div[class*="language-jsx"]',
  );
  blocks.forEach((block) => {
    if (block.querySelector(".cn-run")) return;
    const code = block.querySelector("code")?.textContent ?? "";
    if (!code.trim()) return;
    const a = document.createElement("a");
    a.className = "cn-run";
    a.textContent = "▶ Run";
    a.setAttribute("aria-label", "Open this snippet in the playground");
    a.href = `${base}playground#code=${encodeCode(code)}`;
    block.appendChild(a);
  });
}
