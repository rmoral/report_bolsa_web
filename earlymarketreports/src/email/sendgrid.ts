/**
 * Send transactional emails via SendGrid using the premium template.
 * Always sends both html and text; supports List-Unsubscribe, ASM, categories.
 */

import sgMail from "@sendgrid/mail";
import type { EmailTemplateInput } from "./email.types";
import { renderEmail } from "./renderEmail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

/** Header values must be printable ASCII only (no CR/LF, no Unicode). */
function sanitizeHeaderValue(v: string): string {
  return v
    .replace(/[\r\n\x00-\x1f\x7f]/g, " ")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (typeof v === "string") out[k] = sanitizeHeaderValue(v);
  }
  return out;
}

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailParams {
  to: string | string[];
  templateData: EmailTemplateInput;
  from: string;
  replyTo?: string;
  categories?: string[];
  customArgs?: Record<string, string>;
  asm?: { groupId: number; groupsToDisplay?: number[] };
  ipPoolName?: string;
  sendAt?: number;
  /** List-Unsubscribe URL (one-click if ASM group used) */
  unsubscribeUrl?: string;
  /** Inline CSS in HTML (default true) */
  inlineCss?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  statusCode?: number;
  error?: string;
  responseBody?: unknown;
}

/**
 * Send an email using the premium Handlebars template.
 * - Renders HTML and text from templateData
 * - Sets List-Unsubscribe and List-Unsubscribe-Post when unsubscribeUrl is provided
 * - Uses SendGrid ASM when asm is provided
 * - Supports multiple recipients (to as array)
 * - Surfaces errors with statusCode and response body for debugging
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const {
    to,
    templateData,
    from,
    replyTo,
    categories,
    customArgs,
    asm,
    ipPoolName,
    sendAt,
    unsubscribeUrl,
    inlineCss = true,
  } = params;

  if (!SENDGRID_API_KEY?.trim()) {
    return {
      success: false,
      error: "SENDGRID_API_KEY is not set",
    };
  }

  const { subject, html, text, headers } = renderEmail(templateData, {
    inlineCss,
  });

  const toArray = Array.isArray(to) ? to : [to];
  const msg: sgMail.MailDataRequired = {
    to: toArray,
    from,
    replyTo,
    subject,
    text,
    html,
    categories,
    customArgs,
    asm,
    ipPoolName,
    sendAt,
    headers: headers ? sanitizeHeaders(headers) : undefined,
  };

  if (unsubscribeUrl) {
    msg.headers = msg.headers || {};
    const h = msg.headers as Record<string, string>;
    h["List-Unsubscribe"] = sanitizeHeaderValue(`<${unsubscribeUrl}>`);
    h["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const [response] = await sgMail.send(msg);
    return {
      success: true,
      messageId: response.headers["x-message-id"] as string | undefined,
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const sgError = err as {
      code?: number;
      message?: string;
      response?: { body?: unknown; statusCode?: number; headers?: unknown };
    };
    return {
      success: false,
      statusCode: sgError.code ?? sgError.response?.statusCode,
      responseBody: sgError.response?.body ?? fullErrorPayload(err),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Serialize error for logging (capture response, body, etc.). */
function fullErrorPayload(err: unknown): unknown {
  if (err === null || err === undefined) return err;
  if (typeof err !== "object") return err;
  const o = err as Record<string, unknown>;
  return {
    message: o.message,
    code: o.code,
    response: o.response
      ? {
          statusCode: (o.response as Record<string, unknown>)?.statusCode,
          body: (o.response as Record<string, unknown>)?.body,
          headers: (o.response as Record<string, unknown>)?.headers,
        }
      : undefined,
    stack: o.stack,
  };
}
