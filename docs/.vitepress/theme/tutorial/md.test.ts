import { describe, test, expect } from "vitest";
import { renderTask } from "./md";

describe("renderTask", () => {
  test("renders bold and inline code", () => {
    const html = renderTask("Use **state** and `state(0)` here.");
    expect(html).toContain("<strong>state</strong>");
    expect(html).toContain("<code>state(0)</code>");
  });

  test("splits blank-line-separated paragraphs", () => {
    const html = renderTask("First para.\n\nSecond para.");
    expect((html.match(/<p>/g) || []).length).toBe(2);
  });

  test("escapes HTML to prevent injection", () => {
    const html = renderTask("a < b and <script>x</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
