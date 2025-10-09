import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { updateUserRole } from "@/lib/firebaseAuth";
import { z } from "zod";

const PromoteSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, role } = PromoteSchema.parse(body);

    await updateUserRole(userId, role);

    return NextResponse.json({ success: true, message: `Usuario promovido a ${role}` });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    console.error("/api/admin/promote-user error", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
