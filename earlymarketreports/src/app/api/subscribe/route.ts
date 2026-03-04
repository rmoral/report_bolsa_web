import { NextResponse } from "next/server";
import { z } from "zod";
// Firestore (Firebase)
import { db } from "@/lib/firebaseAdmin";
import {
  sendInternalNewNewsletterLeadEmail,
  sendNewsletterConfirmationEmail,
} from "@/lib/email";

const SubscribeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(7),
  plan: z.enum(["lite", "pro"]).default("lite"),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, phone, plan, source } = SubscribeSchema.parse(data);
    const ref = await db.collection("subscriptions").add({
      name,
      email,
      phone,
      plan,
      status: plan === "lite" ? "active" : "pending",
      source: source || "homepage",
      createdAt: new Date(),
    });
    const status = plan === "lite" ? "active" : "pending";

    // Emails (best-effort, no bloquean la respuesta si fallan)
    void sendNewsletterConfirmationEmail({ name, email, phone, plan });
    void sendInternalNewNewsletterLeadEmail({ name, email, phone, plan, source });

    return NextResponse.json({ id: ref.id, status }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.issues?.[0]?.message }, { status: 400 });
    console.error("/api/subscribe error", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}


