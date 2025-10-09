import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const snapshot = await db.collection("users")
      .orderBy("createdAt", "desc")
      .get();
    
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(users);
  } catch (err: any) {
    console.error("/api/admin/users error", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
