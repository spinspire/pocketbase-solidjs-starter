import { describe, expect, test } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  test("renders markdown and strips scripts", () => {
    const html = renderMarkdown("# Hi\n\nHello **you**.<script>alert(1)</script>");
    expect(html).toContain("<h1>");
    expect(html).toContain("<strong>you</strong>");
    expect(html).not.toContain("<script>");
  });

  test("empty input renders empty", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown(undefined)).toBe("");
  });
});
