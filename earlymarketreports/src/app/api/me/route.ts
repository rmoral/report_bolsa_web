import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await connectToDatabase();
  const user = await User.findById(payload.sub).lean();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ id: user._id, email: user.email, name: user.name, plan: user.plan, role: user.role });
}


