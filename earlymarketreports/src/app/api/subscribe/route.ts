import { NextResponse } from "next/server";
import { z } from "zod";
// Firestore (Firebase)
import { db } from "@/lib/firebaseAdmin";

const SubscribeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  plan: z.enum(["lite", "pro"]).default("lite"),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, plan, source } = SubscribeSchema.parse(data);
    const ref = await db.collection("subscriptions").add({
      name,
      email,
      plan,
      status: plan === "lite" ? "active" : "pending",
      source: source || "homepage",
      createdAt: new Date(),
    });
    return NextResponse.json({ id: ref.id, status: plan === "lite" ? "active" : "pending" }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.issues?.[0]?.message }, { status: 400 });
    console.error("/api/subscribe error", err);
    return NextResponse.json({ error: err?.message || "Error de servidor" }, { status: 500 });
  }
}


