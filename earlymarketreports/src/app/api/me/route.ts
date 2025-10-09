import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { getUserById } from "@/lib/firebaseAuth";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  
  const user = await getUserById(payload.sub);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  
  return NextResponse.json({ 
    id: user.id, 
    email: user.email, 
    name: user.name, 
    plan: user.plan, 
    role: user.role 
  });
}


