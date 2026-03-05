import type { EmailTemplateInput } from "@/email/email.types";
import { sendEmail as sendGridEmail } from "@/email/sendgrid";

function getEmailConfig() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from =
    process.env.EMAIL_FROM || "EarlyMarketReports <no-reply@earlymarketreports.com>";
  const notifications =
    process.env.EMAIL_NOTIFICATIONS || process.env.EMAIL_ALERTS || "";
  return { apiKey, from, notifications };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://earlymarketreports.com";
const LOGO_URL = `${BASE_URL}/logo.png`;

function buildBaseTemplate(
  overrides: EmailTemplateInput & { subject: string; title: string; body_html: string }
): EmailTemplateInput {
  const year = new Date().getFullYear();

  return {
    brand_name: "EarlyMarketReports",
    brand_url: BASE_URL,
    logo_url: LOGO_URL,
    logo_width: 220,
    support_email: "support@earlymarketreports.com",
    support_url: `${BASE_URL}/support`,
    support_url_text: "Help Center",
    brand_tagline: "Daily market reports before the open.",
    company_legal_name: "EarlyMarketReports Inc.",
    company_address: "123 Market St, New York, NY 10001",
    year,
    ...overrides,
  };
}

export async function sendNewsletterConfirmationEmail(params: {
  name: string;
  email: string;
  phone: string;
  plan: "lite" | "pro";
}) {
  const { name, email, phone, plan } = params;

  const { apiKey, from } = getEmailConfig();
  if (!apiKey?.trim() || !from?.trim()) {
    console.warn(
      "[email] SENDGRID_API_KEY o EMAIL_FROM no configurados. Email no enviado (newsletter confirmation).",
      { hasApiKey: !!apiKey?.trim(), hasFrom: !!from?.trim() }
    );
    return;
  }

  const isLite = plan === "lite";
  const subject = isLite
    ? "Bienvenido a EarlyMarketReports Lite"
    : "Gracias por tu interés en EarlyMarketReports Pro";

  const body_html = [
    `<p>Hola ${name},</p>`,
    `<p>Gracias por suscribirte a <strong>EarlyMarketReports</strong>.</p>`,
    isLite
      ? "<p>Has quedado registrado en la versión <strong>Lite</strong>. Empezarás a recibir nuestros resúmenes diarios en tu correo.</p>"
      : "<p>Hemos registrado tu interés en el plan <strong>Pro</strong>. En breve nos pondremos en contacto contigo.</p>",
    "<p><strong>Datos registrados:</strong></p>",
    "<ul>",
    `<li>Email: ${email}</li>`,
    `<li>Teléfono: ${phone}</li>`,
    `<li>Plan: ${plan}</li>`,
    "</ul>",
    "<p>Si este registro no lo has hecho tú, puedes ignorar este correo.</p>",
    "<p>Equipo EarlyMarketReports</p>",
  ].join("");

  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(
    email
  )}`;

  const templateData = buildBaseTemplate({
    subject,
    title: subject,
    preheader: isLite
      ? "Tu suscripción Lite está activa. Empezarás a recibir resúmenes diarios."
      : "Hemos registrado tu interés en el plan Pro.",
    body_html,
    top_right_text: "Suscripción",
    unsubscribe_url: unsubscribeUrl,
  });

  const result = await sendGridEmail({
    to: email,
    from,
    templateData,
    unsubscribeUrl,
    categories: ["newsletter-confirmation"],
  });

  if (!result.success) {
    console.error("[email] Error enviando newsletter confirmation", result);
  } else {
    console.log("[email] Newsletter confirmation enviado a", email);
  }
}

export async function sendInternalNewNewsletterLeadEmail(params: {
  name: string;
  email: string;
  phone: string;
  plan: "lite" | "pro";
  source?: string;
}) {
  const { notifications } = getEmailConfig();
  if (!notifications?.trim()) {
    console.warn(
      "[email] EMAIL_NOTIFICATIONS no configurado. Notificación interna de newsletter no enviada."
    );
    return;
  }

  const { name, email, phone, plan, source } = params;
  const subject = `[EMR] Nueva alta newsletter (${plan})`;
  const body_html = [
    "<p>Nueva alta en la newsletter / LeadCapture:</p>",
    "<ul>",
    `<li>Nombre: ${name}</li>`,
    `<li>Email: ${email}</li>`,
    `<li>Teléfono: ${phone}</li>`,
    `<li>Plan: ${plan}</li>`,
    `<li>Source: ${source || "desconocido"}</li>`,
    `<li>Fecha: ${new Date().toISOString()}</li>`,
    "</ul>",
  ].join("");

  const templateData = buildBaseTemplate({
    subject,
    title: "Nueva alta newsletter",
    body_html,
    top_right_text: "Interno",
    preheader: `Nueva alta newsletter (${plan})`,
  });

  const recipients = notifications
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const result = await sendGridEmail({
    to: recipients,
    from: process.env.EMAIL_FROM ||
      "EarlyMarketReports <no-reply@earlymarketreports.com>",
    templateData,
    categories: ["internal", "newsletter-lead"],
  });

  if (!result.success) {
    console.error("[email] Error enviando notificación interna newsletter", result);
  } else {
    console.log(
      "[email] Notificación interna newsletter enviada a",
      recipients.join(", ")
    );
  }
}

export async function sendUserWelcomeEmail(params: {
  name: string;
  email: string;
  phone?: string;
  plan: "lite" | "pro";
}) {
  const { name, email, phone, plan } = params;

  const { apiKey, from } = getEmailConfig();
  if (!apiKey?.trim() || !from?.trim()) {
    console.warn(
      "[email] SENDGRID_API_KEY o EMAIL_FROM no configurados. Email no enviado (user welcome).",
      { hasApiKey: !!apiKey?.trim(), hasFrom: !!from?.trim() }
    );
    return;
  }

  const subject = "Tu cuenta en EarlyMarketReports ha sido creada";

  const body_htmlParts: string[] = [
    `<p>Hola ${name},</p>`,
    "<p>Tu cuenta en <strong>EarlyMarketReports</strong> se ha creado correctamente.</p>",
    plan === "pro"
      ? "<p>Tu plan actual es <strong>Pro</strong>. Tendrás acceso a los informes completos y al resto de funcionalidades asociadas.</p>"
      : "<p>Tu plan actual es <strong>Lite</strong>. Puedes actualizar a Pro en cualquier momento desde el panel.</p>",
    "<p><strong>Datos principales:</strong></p>",
    "<ul>",
    `<li>Email: ${email}</li>`,
  ];

  if (phone) {
    body_htmlParts.push(`<li>Teléfono: ${phone}</li>`);
  }
  body_htmlParts.push(`<li>Plan: ${plan}</li>`, "</ul>");
  body_htmlParts.push(
    "<p>Te recomendamos guardar este correo como referencia.</p>",
    "<p>Equipo EarlyMarketReports</p>"
  );

  const body_html = body_htmlParts.join("");

  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(
    email
  )}`;

  const templateData = buildBaseTemplate({
    subject,
    title: "Bienvenido a EarlyMarketReports",
    preheader: "Tu cuenta se ha creado correctamente.",
    body_html,
    top_right_text: "Cuenta creada",
    unsubscribe_url: unsubscribeUrl,
  });

  const result = await sendGridEmail({
    to: email,
    from,
    templateData,
    unsubscribeUrl,
    categories: ["user-welcome"],
  });

  if (!result.success) {
    console.error("[email] Error enviando user welcome", result);
  } else {
    console.log("[email] User welcome enviado a", email);
  }
}

export async function sendInternalNewUserEmail(params: {
  name: string;
  email: string;
  phone?: string;
  plan: "lite" | "pro";
}) {
  const { notifications } = getEmailConfig();
  if (!notifications?.trim()) {
    console.warn(
      "[email] EMAIL_NOTIFICATIONS no configurado. Notificación interna de usuario no enviada."
    );
    return;
  }

  const { name, email, phone, plan } = params;
  const subject = `[EMR] Nuevo usuario registrado (${plan})`;
  const body_htmlParts: string[] = [
    "<p>Nuevo usuario registrado en la app:</p>",
    "<ul>",
    `<li>Nombre: ${name}</li>`,
    `<li>Email: ${email}</li>`,
  ];

  if (phone) {
    body_htmlParts.push(`<li>Teléfono: ${phone}</li>`);
  }

  body_htmlParts.push(
    `<li>Plan: ${plan}</li>`,
    `<li>Fecha: ${new Date().toISOString()}</li>`,
    "</ul>"
  );

  const body_html = body_htmlParts.join("");

  const templateData = buildBaseTemplate({
    subject,
    title: "Nuevo usuario registrado",
    body_html,
    top_right_text: "Interno",
    preheader: `Nuevo usuario registrado (${plan})`,
  });

  const recipients = notifications
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const result = await sendGridEmail({
    to: recipients,
    from: process.env.EMAIL_FROM ||
      "EarlyMarketReports <no-reply@earlymarketreports.com>",
    templateData,
    categories: ["internal", "user-new"],
  });

  if (!result.success) {
    console.error("[email] Error enviando notificación interna usuario", result);
  } else {
    console.log(
      "[email] Notificación interna usuario enviada a",
      recipients.join(", ")
    );
  }
}

