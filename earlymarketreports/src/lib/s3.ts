import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const SIGNED_URL_EXPIRES = 3600; // 1 hora

export interface S3Report {
  filename: string;
  // Fecha extraída del nombre de archivo (ej. US_FULL_20251003.pdf → 2025-10-03)
  date: string | null;
  type: "full" | "sample" | "other";
  size: number;
  lastModified: Date;
}

function parseReport(key: string, size: number, lastModified: Date): S3Report {
  const filename = key.split("/").pop() || key;
  const dateMatch = filename.match(/(\d{4})(\d{2})(\d{2})/);
  const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
  const type = filename.toUpperCase().includes("FULL")
    ? "full"
    : filename.toUpperCase().includes("SAMPLE")
    ? "sample"
    : "other";
  return { filename, date, type, size, lastModified };
}

/**
 * Lista los informes disponibles en S3.
 * - prefix "full/"   → informes completos (Pro)
 * - prefix "sample/" → muestras (Lite)
 */
export async function listReports(type: "full" | "sample" | "all" = "all"): Promise<S3Report[]> {
  const prefixes =
    type === "full" ? ["full/"] : type === "sample" ? ["sample/"] : ["full/", "sample/"];

  const results: S3Report[] = [];

  for (const prefix of prefixes) {
    const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
    const response = await s3.send(command);
    for (const obj of response.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      results.push(parseReport(obj.Key, obj.Size ?? 0, obj.LastModified ?? new Date()));
    }
  }

  // Ordenar por fecha descendente
  return results.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

/**
 * Genera una URL firmada de S3 para un informe (expira en 1h).
 * key debe incluir el prefijo: "full/US_FULL_20251003.pdf"
 */
export async function getReportSignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRES });
}
