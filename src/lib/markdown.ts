import createDOMPurify from "dompurify";
import { marked } from "marked";

// Markdown → sanitized HTML. Authors are authenticated but content renders
// for everyone, so raw innerHTML from the parser never reaches the DOM.
export function renderMarkdown(src: string | undefined | null): string {
  if (!src) return "";
  const dirty = marked.parse(src, { async: false }) as string;
  return createDOMPurify(window).sanitize(dirty);
}
