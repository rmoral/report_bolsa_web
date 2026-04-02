import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { getUserById, updateUser } from "@/lib/firebaseAuth";
import { stripe } from "@/lib/stripe";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await getUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Buscar el customer de Stripe por email para exponer el customerId
  let stripeCustomerId: string | null = null;
  try {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    stripeCustomerId = customers.data[0]?.id ?? null;
  } catch {
    // No bloqueamos la respuesta si Stripe falla
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    plan: user.plan,
    role: user.role,
    stripeCustomerId,
  });
}

export async function PATCH(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await getUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const allowed = ["name", "phone"] as const;
  const updates: Partial<Record<typeof allowed[number], string>> = {};
  for (const key of allowed) {
    if (typeof body[key] === "string" && body[key].trim()) {
      updates[key] = body[key].trim();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  await updateUser(payload.sub, updates);
  return NextResponse.json({ ok: true });
}
