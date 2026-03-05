/**
 * Sample payloads for the premium email template.
 * Use for preview (build-email-preview) and send-test-email scripts.
 */

import type { EmailTemplateInput } from "./email.types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://earlymarketreports.com";
/** Logo: public/logo.png → served at /logo.png, so logo_url = BASE_URL + "/logo.png" */
const LOGO_URL = `${BASE_URL}/logo.png`;

/** Sample A: Verification email with CTA, alerts, and table */
export const sampleVerification: EmailTemplateInput = {
  subject: "Verify your email address",
  preheader: "One more step — click the button below to confirm your account.",
  brand_url: BASE_URL,
  logo_url: LOGO_URL,
  logo_width: 220,
  brand_name: "EarlyMarketReports",
  top_right_text: "Verification",

  accent_1: "#2563eb",
  accent_2: "#22c55e",
  badge_text: "Verify your account",
  title: "Verify your email address",
  subtitle: "You signed up with this email. Click the button below to confirm.",
  intro: "We need to verify that you own this email address before you can access your account.",
  body_html: "<p>Click the button below to verify your email. This link expires in 24 hours.</p><p>If you didn't create an account, you can safely ignore this email.</p>",

  cta: {
    url: `${BASE_URL}/api/verify?token=abc123`,
    text: "Verify email address",
    helper: "Link expires in 24 hours.",
  },
  secondary_cta: {
    url: `${BASE_URL}/login`,
    text: "Go to login",
  },

  alerts: [
    {
      type: "Security",
      message: "Never share this link with anyone. We will never ask for it by email.",
      badge_class: "badge-info",
      badge_style: "background:#eff8ff;color:#175cd3;",
    },
  ],
  table: {
    title: "Account details",
    headers: ["Field", "Value"],
    rows: [
      ["Email", "user@example.com"],
      ["Requested at", "2025-01-15 10:30 UTC"],
    ],
    note: "If you did not request this, please contact support.",
  },

  support_email: "support@earlymarketreports.com",
  support_url: `${BASE_URL}/support`,
  support_url_text: "Help Center",
  brand_tagline: "Daily market reports before the open.",

  company_legal_name: "EarlyMarketReports Inc.",
  company_address: "123 Market St, Suite 100, New York, NY 10001",
  vat_id: "US123456789",
  year: new Date().getFullYear(),

  legal_note: "This is an automated message. Please do not reply to this email.",
  unsubscribe_url: `${BASE_URL}/unsubscribe`,
  preferences_url: `${BASE_URL}/preferences`,
  privacy_url: `${BASE_URL}/legal/privacidad`,
  terms_url: `${BASE_URL}/legal/terminos`,
  view_in_browser_url: `${BASE_URL}/view/abc123`,
};

/** Sample B: Simple notification (no CTA, no alerts, no table) */
export const sampleSimpleNotification: EmailTemplateInput = {
  subject: "Your daily report is ready",
  preheader: "Your EarlyMarketReports summary for today.",
  brand_url: BASE_URL,
  logo_url: LOGO_URL,
  brand_name: "EarlyMarketReports",
  title: "Your daily report is ready",
  subtitle: "Here’s your market summary for today.",
  body_html: "<p>Your Lite report has been generated and is available in your dashboard.</p><p>Log in to view the full summary and key levels.</p>",

  support_email: "support@earlymarketreports.com",
  support_url: `${BASE_URL}/support`,
  brand_tagline: "Daily market reports before the open.",
  company_legal_name: "EarlyMarketReports Inc.",
  company_address: "123 Market St, New York, NY 10001",
  year: new Date().getFullYear(),
};
