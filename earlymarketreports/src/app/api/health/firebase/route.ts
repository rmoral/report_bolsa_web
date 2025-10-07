import { NextResponse } from "next/server";
import { db, getFirebaseDebugInfo } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  try {
    const now = new Date();
    if (!dry) {
      await db.collection("healthchecks").add({ ts: now, ok: true });
    }
    const subsSnap = await db.collection("subscriptions").limit(1).get();
    return NextResponse.json({ ok: true, wrote: !dry, sampleSubscriptions: subsSnap.size, debug: getFirebaseDebugInfo() });
  } catch (e: any) {
    console.error("/api/health/firebase error", e);
    return NextResponse.json({ ok: false, error: e?.message || "error", debug: getFirebaseDebugInfo() }, { status: 500 });
  }
}


