import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
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

    await connectToDatabase();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, plan });

    return NextResponse.json({ id: user._id, email: user.email, plan: user.plan }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}


