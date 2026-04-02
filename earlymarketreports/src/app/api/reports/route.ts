import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { listReports } from "@/lib/s3";

// GET /api/reports?type=full|sample|all
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedType = searchParams.get("type") as "full" | "sample" | "all" | null;

  // Usuarios Lite solo pueden ver muestras
  const isPro = payload.plan === "pro";
  const type = isPro ? (requestedType ?? "all") : "sample";

  try {
    const reports = await listReports(type);
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("[api/reports] Error listando S3:", err);
    return NextResponse.json({ error: "No se pudieron cargar los informes" }, { status: 500 });
  }
}
