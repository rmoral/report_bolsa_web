import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    await connectToDatabase();
    const user = await User.findOne({ email, isActive: true });
    if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const token = jwt.sign({ sub: user._id.toString(), role: user.role, plan: user.plan }, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    return NextResponse.json({ token, user: { id: user._id, email: user.email, plan: user.plan } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}


