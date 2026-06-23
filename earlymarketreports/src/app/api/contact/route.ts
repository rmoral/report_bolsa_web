import { NextResponse } from "next/server";
import { z } from "zod";
import sgMail from "@sendgrid/mail";

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

const CONTACT_EMAIL = "ruben@earlymarketreports.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = ContactSchema.parse(body);

    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.EMAIL_FROM || "EarlyMarketReports <no-reply@earlymarketreports.com>";

    if (!apiKey?.trim()) {
      console.warn("[contact] SENDGRID_API_KEY no configurado");
      return NextResponse.json({ error: "Servicio de email no disponible" }, { status: 503 });
    }

    sgMail.setApiKey(apiKey);

    const subjectLine = subject
      ? `[Contacto] ${subject} — de ${name}`
      : `[Contacto] Mensaje de ${name}`;

    await sgMail.send({
      to: CONTACT_EMAIL,
      from,
      replyTo: { email, name },
      subject: subjectLine,
      text: [
        `Nombre: ${name}`,
        `Email: ${email}`,
        subject ? `Asunto: ${subject}` : "",
        "",
        message,
      ].filter(Boolean).join("\n"),
      html: `
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${subject ? `<p><strong>Asunto:</strong> ${subject}</p>` : ""}
        <hr/>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    console.error("[api/contact] Error:", err);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
