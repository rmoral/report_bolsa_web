/**
 * Sanitize body_html (triple-stash content) for the premium email template.
 * Production-safe: allow-list only. No script, no inline handlers, no dangerous URLs.
 *
 * Rules:
 * - Allow only tags: p, br, strong, b, em, i, ul, ol, li, a, code, pre, span
 * - a: only href, target, rel. http(s) → force target="_blank" + rel="noopener noreferrer". mailto: → no target
 * - span: only style, with whitelisted properties: color, font-weight, font-style, text-decoration
 * - Block: script, style, img, svg, iframe, object, embed, video, audio
 * - Block: any on* attribute (onload, onclick, etc.)
 * - Block: href="javascript:..." and href="data:..."
 */

import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "span",
] as const;

/** Whitelisted CSS properties for span[style]. No url(), expression(), etc. */
const STYLE_WHITELIST = ["color", "font-weight", "font-style", "text-decoration"] as const;
const STYLE_WHITELIST_REGEX = new RegExp(
  `^\\s*(${STYLE_WHITELIST.join("|")})\\s*:\\s*[^;]+;?\\s*$`,
  "i"
);

function sanitizeSpanStyle(style: string): string {
  if (!style || typeof style !== "string") return "";
  const out: string[] = [];
  for (const part of style.split(";")) {
    const trimmed = part.trim();
    if (trimmed && STYLE_WHITELIST_REGEX.test(trimmed + ";")) {
      out.push(trimmed);
    }
  }
  return out.join("; ");
}

/** Strip javascript:, data:, vbscript:, file: and any other dangerous href. */
function sanitizeHref(href: string): string {
  const h = href.trim().toLowerCase();
  if (
    h.startsWith("javascript:") ||
    h.startsWith("data:") ||
    h.startsWith("vbscript:") ||
    h.startsWith("file:")
  ) {
    return "#";
  }
  return href;
}

/**
 * Sanitize body HTML for safe inclusion in emails (triple-stash in Handlebars).
 *
 * - Allow only: p, br, strong, b, em, i, ul, ol, li, a, code, pre, span
 * - a: href, target, rel only. http(s) → target="_blank" + rel="noopener noreferrer". mailto: unchanged.
 * - span: style only; style limited to color, font-weight, font-style, text-decoration
 * - Block: script, style, img, svg, iframe, object, embed, video, audio (not in allow-list)
 * - Block: all on* attributes (not in allowedAttributes)
 * - Block: javascript: and data: (and similar) in href
 */
export function sanitizeBodyHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  const cleaned = sanitizeHtml(html, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
    },
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href ?? "";
        const isHttp =
          href.trim().startsWith("http://") || href.trim().startsWith("https://");
        const attribsOut: Record<string, string> = {
          href: sanitizeHref(href),
        };
        if (isHttp) {
          attribsOut.target = "_blank";
          attribsOut.rel = "noopener noreferrer";
        }
        return { tagName: "a", attribs: attribsOut };
      },
      span: (_tagName, attribs) => {
        const style = attribs.style ? sanitizeSpanStyle(attribs.style) : "";
        return {
          tagName: "span",
          attribs: style ? { style } : {},
        };
      },
    },
    allowedClasses: {},
    allowVulnerableTags: false,
  });

  return cleaned;
}
