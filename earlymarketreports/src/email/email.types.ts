/**
 * Strict types for the premium Handlebars email template.
 * All template placeholders are typed here for compile-time safety.
 */

// ─── CTA & Alerts & Table (helper types) ─────────────────────────────────────

/** CTA block (primary button) */
export interface EmailCta {
  url: string;
  text: string;
  helper?: string;
}

/** Secondary CTA (link-style button) */
export interface EmailSecondaryCta {
  url: string;
  text: string;
}

/** Single alert/panel in the email body */
export interface EmailAlert {
  type?: string;
  message: string;
  badge_class?: string;
  badge_style?: string;
}

/** Data table module */
export interface EmailTable {
  title?: string;
  headers?: string[];
  rows?: string[][];
  note?: string;
}

// ─── Main template data ──────────────────────────────────────────────────────

/**
 * Full template data for premium.hbs.html.
 * Required: subject, brand_name, logo_url, title, body_html.
 */
export interface EmailTemplateData {
  subject: string;
  preheader?: string;
  brand_name: string;
  brand_url?: string;
  logo_url: string;
  logo_width?: number | string;
  top_right_text?: string;

  accent_1?: string;
  accent_2?: string;
  badge_text?: string;
  title: string;
  subtitle?: string;
  intro?: string;
  /** HTML body (sanitized in renderEmail) */
  body_html: string;

  cta?: EmailCta;
  secondary_cta?: EmailSecondaryCta;

  alerts?: EmailAlert[];
  table?: EmailTable;

  // Footer / legal
  brand_tagline?: string;
  support_email?: string;
  support_url?: string;
  support_url_text?: string;
  company_legal_name?: string;
  company_address?: string;
  vat_id?: string;
  year?: string | number;
  legal_note?: string;
  unsubscribe_url?: string;
  preferences_url?: string;
  privacy_url?: string;
  terms_url?: string;
  view_in_browser_url?: string;
}

/** Keys required for a valid send */
export type RequiredEmailTemplateKeys =
  | "subject"
  | "brand_name"
  | "logo_url"
  | "title"
  | "body_html";

/** Deep partial: all nested properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Input for renderEmail: required keys + optional rest; normalize() fills defaults */
export type EmailTemplateInput = Pick<EmailTemplateData, RequiredEmailTemplateKeys> &
  DeepPartial<Omit<EmailTemplateData, RequiredEmailTemplateKeys>>;

/**
 * Normalize optional fields to safe defaults before rendering.
 * - alerts => [] if undefined
 * - table.rows / table.headers => [] if undefined
 * - accent_1, accent_2, logo_width, year => defaults
 * - support_url_text derived from support_url if missing
 * - cta hidden if cta.url is missing
 */
export type NormalizeEmailTemplateData = (data: EmailTemplateInput) => EmailTemplateData;
