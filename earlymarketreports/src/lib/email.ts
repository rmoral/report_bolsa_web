import sgMail from "@sendgrid/mail";

type BaseEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getEmailConfig() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from =
    process.env.EMAIL_FROM || "EarlyMarketReports <no-reply@earlymarketreports.com>";
  const notifications =
    process.env.EMAIL_NOTIFICATIONS || process.env.EMAIL_ALERTS || "";
  return { apiKey, from, notifications };
}

async function sendEmail({ to, subject, text, html }: BaseEmail) {
  const { apiKey, from } = getEmailConfig();

  if (!apiKey?.trim() || !from?.trim()) {
    console.warn(
      "[email] SENDGRID_API_KEY o EMAIL_FROM no configurados. Email no enviado.",
      { hasApiKey: !!apiKey?.trim(), hasFrom: !!from?.trim() }
    );
    return;
  }

  sgMail.setApiKey(apiKey);

  try {
    await sgMail.send({
      to,
      from,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br />"),
    });
    console.log("[email] Enviado correctamente a", to);
  } catch (err) {
    console.error("[email] Error enviando email", err);
  }
}

export async function sendNewsletterConfirmationEmail(params: {
  name: string;
  email: string;
  phone: string;
  plan: "lite" | "pro";
}) {
  const { name, email, phone, plan } = params;

  const subject = "Bienvenido a EarlyMarketReports Lite";
  const text = [
    `Hola ${name},`,
    "",
    "Gracias por suscribirte a EarlyMarketReports.",
    plan === "lite"
      ? "Has quedado registrado en la versión Lite. Empezarás a recibir nuestros resúmenes diarios en tu correo."
      : "Hemos registrado tu interés en el plan Pro. En breve nos pondremos en contacto contigo.",
    "",
    "Datos registrados:",
    `- Email: ${email}`,
    `- Teléfono: ${phone}`,
    "",
    "Si este registro no lo has hecho tú, puedes ignorar este correo.",
    "",
    "Equipo EarlyMarketReports",
  ].join("\n");

  await sendEmail({ to: email, subject, text });
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
  const text = [
    "Nueva alta en la newsletter / LeadCapture:",
    "",
    `- Nombre: ${name}`,
    `- Email: ${email}`,
    `- Teléfono: ${phone}`,
    `- Plan: ${plan}`,
    `- Source: ${source || "desconocido"}`,
    `- Fecha: ${new Date().toISOString()}`,
  ].join("\n");

  const recipients = notifications.split(",").map((e) => e.trim()).filter(Boolean);

  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject,
        text,
      })
    )
  );
}

export async function sendUserWelcomeEmail(params: {
  name: string;
  email: string;
  phone?: string;
  plan: "lite" | "pro";
}) {
  const { name, email, phone, plan } = params;

  const subject = "Tu cuenta en EarlyMarketReports ha sido creada";
  const text = [
    `Hola ${name},`,
    "",
    "Tu cuenta en EarlyMarketReports se ha creado correctamente.",
    plan === "pro"
      ? "Tu plan actual es Pro. Tendrás acceso a los informes completos y resto de funcionalidades asociadas."
      : "Tu plan actual es Lite. Puedes actualizar a Pro en cualquier momento desde el panel.",
    "",
    "Datos principales:",
    `- Email: ${email}`,
    phone ? `- Teléfono: ${phone}` : "",
    `- Plan: ${plan}`,
    "",
    "Te recomendamos guardar este correo como referencia.",
    "",
    "Equipo EarlyMarketReports",
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail({ to: email, subject, text });
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
  const text = [
    "Nuevo usuario registrado en la app:",
    "",
    `- Nombre: ${name}`,
    `- Email: ${email}`,
    phone ? `- Teléfono: ${phone}` : "",
    `- Plan: ${plan}`,
    `- Fecha: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const recipients = notifications.split(",").map((e) => e.trim()).filter(Boolean);

  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject,
        text,
      })
    )
  );
}

