import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || undefined;
  const user = verifyAuth(auth);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const snapshot = await db.collection("subscriptions").orderBy("createdAt", "desc").get();
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(docs);
}


