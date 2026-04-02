import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { getReportSignedUrl } from "@/lib/s3";

// GET /api/reports/[filename]
// Devuelve una URL firmada de S3 para el informe solicitado.
// Usuarios Pro → pueden acceder a full/ y sample/
// Usuarios Lite → solo sample/
export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { filename } = params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "full" | "sample"
  const isPro = payload.plan === "pro";
  const isSample = type === "sample";

  // Usuarios Lite solo pueden acceder a muestras
  if (!isPro && !isSample) {
    return NextResponse.json({ error: "Acceso restringido al plan Pro" }, { status: 403 });
  }

  const prefix = isSample ? "sample/" : "full/";
  const key = `${prefix}${filename}`;

  try {
    const url = await getReportSignedUrl(key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[api/reports/filename] Error generando signed URL:", err);
    return NextResponse.json({ error: "No se pudo acceder al informe" }, { status: 500 });
  }
}
