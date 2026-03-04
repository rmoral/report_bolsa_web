import { NextResponse } from "next/server";
import {
  sendNewsletterConfirmationEmail,
  sendInternalNewNewsletterLeadEmail,
} from "@/lib/email";

/**
 * Test endpoint para comprobar envío de correos (solo en desarrollo).
 * GET /api/test-email
 *   ?to=tu@email.com  — destino del correo (o usa primer EMAIL_NOTIFICATIONS)
 *   ?check=1          — solo devuelve estado de env (no envía correo)
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const checkOnly = searchParams.get("check") === "1";

  // Diagnóstico: comprobar si las variables están cargadas
  const envStatus = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY
      ? `set (${process.env.SENDGRID_API_KEY.substring(0, 7)}...)`
      : "NOT SET",
    EMAIL_FROM: process.env.EMAIL_FROM || "NOT SET",
    EMAIL_NOTIFICATIONS: process.env.EMAIL_NOTIFICATIONS
      ? `set (${process.env.EMAIL_NOTIFICATIONS.split(",").length} destinatario(s))`
      : "NOT SET",
  };

  if (checkOnly) {
    return NextResponse.json({
      message: "Solo diagnóstico. Usa ?to=tu@email.com para enviar un correo de prueba.",
      env: envStatus,
      okToSend:
        !!process.env.SENDGRID_API_KEY?.trim() && !!process.env.EMAIL_FROM?.trim(),
    });
  }

  const to = searchParams.get("to") || process.env.EMAIL_NOTIFICATIONS?.split(",")[0]?.trim();

  if (!to) {
    return NextResponse.json(
      {
        error: "Provide ?to=email@example.com or set EMAIL_NOTIFICATIONS in .env.local",
        env: envStatus,
      },
      { status: 400 }
    );
  }

  try {
    // Envía correo de confirmación al usuario (simulando alta newsletter)
    await sendNewsletterConfirmationEmail({
      name: "Test User",
      email: to,
      phone: "+34600000000",
      plan: "lite",
    });

    // Envía notificación interna (a EMAIL_NOTIFICATIONS)
    if (process.env.EMAIL_NOTIFICATIONS) {
      await sendInternalNewNewsletterLeadEmail({
        name: "Test User",
        email: to,
        phone: "+34600000000",
        plan: "lite",
        source: "test-email-script",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Test emails sent. Check inbox (and EMAIL_NOTIFICATIONS inbox if set).",
      to,
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
