/**
 * Convert HTML to plain text for the text/plain part of emails.
 * Preserves paragraph breaks and list bullets; decodes HTML entities.
 */

import he from "he";

export interface HtmlToTextOptions {
  /** If set, append a line: "If the button doesn't work, open: <url>" */
  ctaUrl?: string;
}

/**
 * Convert HTML to plain text suitable for email text/plain part.
 * - Strips tags and preserves structure (paragraphs -> double newline, lists -> bullets)
 * - Decodes HTML entities (e.g. &amp; -> &)
 * - If ctaUrl is provided, appends: "If the button doesn't work, open: <url>"
 */
export function htmlToText(html: string, opts?: HtmlToTextOptions): string {
  if (!html || typeof html !== "string") return "";

  let text = html
    // Block elements: treat as paragraph boundaries
    .replace(/<\/?(?:p|div|tr|h[1-6]|li)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Lists: preserve list items as bullets
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?[ou]l[^>]*>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Normalize whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  text = he.decode(text);

  if (opts?.ctaUrl) {
    text += "\n\nIf the button doesn't work, open: " + opts.ctaUrl;
  }

  return text;
}
