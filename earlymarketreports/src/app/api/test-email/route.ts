import { NextResponse } from "next/server";
import {
  sendNewsletterConfirmationEmail,
  sendInternalNewNewsletterLeadEmail,
  sendUserWelcomeEmail,
  sendInternalNewUserEmail,
} from "@/lib/email";

/**
 * Test endpoint para comprobar envío de correos (solo en desarrollo).
 * GET /api/test-email
 *   ?to=tu@email.com  — destino del correo de confirmación al usuario
 *   ?check=1          — solo devuelve estado de env (no envía correo)
 *   ?flow=newsletter  — prueba flujo newsletter (por defecto)
 *   ?flow=register    — prueba flujo registro de usuario
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const checkOnly = searchParams.get("check") === "1";
  const flow = searchParams.get("flow") || "newsletter";

  // Diagnóstico: comprobar si las variables están cargadas
  const envStatus = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
      ? `set (${process.env.SENDGRID_API_KEY.substring(0, 7)}...)`
      : "NOT SET",
    EMAIL_FROM: process.env.EMAIL_FROM || "NOT SET (default: no-reply@earlymarketreports.com)",
    EMAIL_NOTIFICATIONS: process.env.EMAIL_NOTIFICATIONS
      ? `set (${process.env.EMAIL_NOTIFICATIONS.split(",").length} destinatario(s))`
      : "NOT SET (default: ruben@earlymarketreports.com)",
  };

  if (checkOnly) {
    return NextResponse.json({
      message: "Solo diagnóstico. Usa ?to=tu@email.com para enviar un correo de prueba.",
      env: envStatus,
      okToSend: !!process.env.SENDGRID_API_KEY?.trim(),
    });
  }

  const to = searchParams.get("to") || process.env.EMAIL_NOTIFICATIONS?.split(",")[0]?.trim() || "ruben@earlymarketreports.com";

  try {
    if (flow === "register") {
      // Prueba flujo registro de usuario (/api/auth/register)
      await sendUserWelcomeEmail({ name: "Test User", email: to, phone: "+34600000000", plan: "lite" });
      await sendInternalNewUserEmail({ name: "Test User", email: to, phone: "+34600000000", plan: "lite" });
    } else {
      // Prueba flujo newsletter (/api/subscribe)
      await sendNewsletterConfirmationEmail({ name: "Test User", email: to, phone: "+34600000000", plan: "lite" });
      await sendInternalNewNewsletterLeadEmail({ name: "Test User", email: to, phone: "+34600000000", plan: "lite", source: "test-email-endpoint" });
    }

    return NextResponse.json({
      ok: true,
      message: `Emails de prueba enviados (flow: ${flow}). Revisa el buzón.`,
      to,
      flow,
      env: envStatus,
    });
  } catch (err: unknown) {
    console.error("[test-email]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
