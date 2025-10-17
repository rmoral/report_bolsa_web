import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/firebaseAuth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const user = await getUserByEmail(email);
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json(
        { message: "If the email exists, a recovery link has been sent" },
        { status: 200 }
      );
    }

    // En un entorno real, aquí enviarías un email con un token de recuperación
    // Por ahora, simulamos el envío
    console.log(`Password reset requested for: ${email}`);
    
    // TODO: Implementar envío real de email
    // - Generar token de recuperación
    // - Guardar token en base de datos con expiración
    // - Enviar email con enlace de recuperación
    
    return NextResponse.json(
      { message: "If the email exists, a recovery link has been sent" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
