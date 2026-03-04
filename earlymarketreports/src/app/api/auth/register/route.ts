import { NextResponse } from "next/server";
import { createUser } from "@/lib/firebaseAuth";
import { z } from "zod";
import {
  sendInternalNewUserEmail,
  sendUserWelcomeEmail,
} from "@/lib/email";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  phone: z.string().min(7),
  plan: z.enum(["lite", "pro"]).default("lite"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, plan } = RegisterSchema.parse(body);

    const user = await createUser({ name, email, password, phone, plan });

    // Emails (best-effort)
    void sendUserWelcomeEmail({ name, email, phone, plan });
    void sendInternalNewUserEmail({ name, email, phone, plan });

    return NextResponse.json(
      { id: user.id, email: user.email, plan: user.plan, phone: user.phone },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    if (err.message === "Email ya registrado") {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }
    console.error("/api/auth/register error", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}


