import { NextResponse } from "next/server";
import { verifyAuth } from "@/middleware/auth";
import { db } from "@/lib/firebaseAdmin";
import { z } from "zod";

const UpdateSubscriptionSchema = z.object({
  status: z.enum(["pending", "active", "canceled"]).optional(),
  plan: z.enum(["lite", "pro"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status, plan } = UpdateSubscriptionSchema.parse(body);
    const subscriptionId = params.id;

    // Verificar que la suscripción existe
    const subscriptionRef = db.collection("subscriptions").doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    // Actualizar campos proporcionados
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (status !== undefined) updateData.status = status;
    if (plan !== undefined) updateData.plan = plan;

    await subscriptionRef.update(updateData);

    return NextResponse.json({ 
      success: true, 
      message: "Suscripción actualizada correctamente" 
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.issues?.[0]?.message || "Datos inválidos" }, { status: 400 });
    }
    console.error("/api/admin/subscriptions/[id] error", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || undefined;
  const payload = verifyAuth(auth || undefined);
  
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const subscriptionId = params.id;

    // Verificar que la suscripción existe
    const subscriptionRef = db.collection("subscriptions").doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    // Eliminar la suscripción
    await subscriptionRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: "Suscripción eliminada correctamente" 
    });
  } catch (err: any) {
    console.error("/api/admin/subscriptions/[id] DELETE error", err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
