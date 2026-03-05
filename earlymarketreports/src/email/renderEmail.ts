/**
 * Compile and render the premium Handlebars email template.
 * - Loads template from filesystem with in-memory caching
 * - Applies defaults, validates required fields, sanitizes body_html
 * - Optional CSS inlining via juice
 */

import Handlebars from "handlebars";
import path from "path";
import fs from "fs";
import juice from "juice";
import type { EmailTemplateData, EmailTemplateInput } from "./email.types";
import { sanitizeBodyHtml } from "./email.sanitizer";
import { htmlToText } from "./email.text";

const REQUIRED_KEYS: (keyof EmailTemplateData)[] = [
  "subject",
  "brand_name",
  "logo_url",
  "title",
  "body_html",
];

let cachedTemplate: Handlebars.TemplateDelegate<EmailTemplateData> | null = null;
/** Resolve template path: works from cwd (scripts) and from compiled output (Next). */
function getTemplatePath(): string {
  const fromCwd = path.resolve(process.cwd(), "src/email/templates/premium.hbs.html");
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromDir = path.resolve(__dirname, "templates", "premium.hbs.html");
  if (fs.existsSync(fromDir)) return fromDir;
  return fromCwd; // fail when read
}

function loadTemplate(): Handlebars.TemplateDelegate<EmailTemplateData> {
  if (cachedTemplate) return cachedTemplate;
  const fullPath = getTemplatePath();
  const source = fs.readFileSync(fullPath, "utf-8");
  cachedTemplate = Handlebars.compile<EmailTemplateData>(source, {
    noEscape: true,
    strict: true,
  });
  return cachedTemplate;
}

/**
 * Normalize optional fields to safe defaults and sanitize body_html.
 */
function normalize(data: EmailTemplateInput): EmailTemplateData {
  const year = data.year ?? new Date().getFullYear();
  const supportUrl = data.support_url ?? "";
  const supportUrlText =
    data.support_url_text ?? (supportUrl ? "Help Center" : "");

  const normalized: EmailTemplateData = {
    subject: data.subject,
    preheader: data.preheader ?? "",
    brand_url: data.brand_url ?? "#",
    logo_url: data.logo_url,
    logo_width: data.logo_width ?? 220,
    brand_name: data.brand_name,
    top_right_text: data.top_right_text,

    accent_1: data.accent_1 ?? "#2563eb",
    accent_2: data.accent_2 ?? "#22c55e",
    badge_text: data.badge_text,
    title: data.title,
    subtitle: data.subtitle,
    intro: data.intro,
    body_html: sanitizeBodyHtml(data.body_html ?? ""),

    cta: data.cta?.url ? data.cta : undefined,
    secondary_cta: data.secondary_cta,

    alerts: data.alerts ?? [],
    table: data.table
      ? {
          title: data.table.title,
          headers: data.table.headers ?? [],
          rows: data.table.rows ?? [],
          note: data.table.note,
        }
      : undefined,
    // footer/legal

    support_email: data.support_email,
    support_url: data.support_url,
    support_url_text: supportUrlText,
    brand_tagline: data.brand_tagline ?? "",

    company_legal_name: data.company_legal_name ?? "",
    company_address: data.company_address ?? "",
    vat_id: data.vat_id,
    year,

    legal_note: data.legal_note,
    unsubscribe_url: data.unsubscribe_url,
    preferences_url: data.preferences_url,
    privacy_url: data.privacy_url,
    terms_url: data.terms_url,
    view_in_browser_url: data.view_in_browser_url,
  };

  return normalized;
}

/**
 * Sanitize header values for SendGrid/HTTP: only printable ASCII.
 * Strips CR/LF, control chars, and non-ASCII (e.g. em dash "—") to avoid "Invalid character in header content".
 */
function sanitizeHeaderValue(value: string): string {
  return value
    .replace(/[\r\n\x00-\x1f\x7f]/g, " ")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateRequired(data: EmailTemplateData): void {
  for (const key of REQUIRED_KEYS) {
    const val = data[key];
    if (val === undefined || val === null || String(val).trim() === "") {
      throw new Error(`Email template missing required field: ${key}`);
    }
  }
}

export interface RenderEmailOptions {
  /** Inline CSS into style attributes for clients that strip <style>. Default true. */
  inlineCss?: boolean;
}

export interface RenderEmailResult {
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

/**
 * Render the premium email template.
 * - Applies defaults (accent_1, accent_2, logo_width, year, support_url_text)
 * - Validates required: subject, brand_name, logo_url, title
 * - Sanitizes body_html; normalizes alerts => [], table.rows => []; hides CTA if no cta.url
 * - Returns { subject, html, text } and optional headers.
 * - If inlineCss !== false, runs juice to inline CSS (keeps <style> for supporting clients).
 */
export function renderEmail(
  data: EmailTemplateInput,
  opts?: RenderEmailOptions
): RenderEmailResult {
  const normalized = normalize(data);
  validateRequired(normalized);

  const template = loadTemplate();
  let html = template(normalized);

  const inlineCss = opts?.inlineCss !== false;
  if (inlineCss) {
    html = juice(html, { preserveImportant: true });
  }

  const ctaUrl = normalized.cta?.url;
  const text = htmlToText(html, { ctaUrl });

  const headers: Record<string, string> = {};
  // Preheader is already in HTML; some clients use it from a header.
  // Header values must not contain CR/LF or other control chars (SendGrid rejects them).
  if (normalized.preheader) {
    headers["X-Preheader"] = sanitizeHeaderValue(normalized.preheader);
  }

  return {
    subject: normalized.subject,
    html,
    text,
    headers: Object.keys(headers).length ? headers : undefined,
  };
}
