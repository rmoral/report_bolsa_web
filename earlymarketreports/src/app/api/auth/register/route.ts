import { NextResponse } from "next/server";
import { createUser } from "@/lib/firebaseAuth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  plan: z.enum(["lite", "pro"]).default("lite"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, plan } = RegisterSchema.parse(body);

    const user = await createUser({ name, email, password, plan });

    return NextResponse.json({ id: user.id, email: user.email, plan: user.plan }, { status: 201 });
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


