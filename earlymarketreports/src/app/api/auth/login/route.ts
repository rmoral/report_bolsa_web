import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/firebaseAuth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const result = await authenticateUser(email, password);

    return NextResponse.json({ 
      token: result.token, 
      user: { 
        id: result.user.id, 
        email: result.user.email, 
        plan: result.user.plan,
        role: result.user.role 
      } 
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    if (err.message === "Credenciales inválidas") {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
    console.error("/api/auth/login error", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}


