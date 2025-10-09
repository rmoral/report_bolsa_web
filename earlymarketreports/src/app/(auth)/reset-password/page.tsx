"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || "Error al restablecer la contraseña");
      
      alert("Contraseña restablecida exitosamente. Ya puedes iniciar sesión.");
      router.replace("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[--emr-blue-10] to-[--emr-green-10] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center gap-3 mb-6">
              <img src="/logo.png" alt="EarlyMarketReports" className="w-12 h-12 rounded" />
              <span className="text-2xl font-bold text-[--color-primary]">EarlyMarketReports</span>
            </Link>
            <h1 className="text-3xl font-bold text-[--color-primary] mb-2">
              Token Inválido
            </h1>
            <p className="text-gray-600 mb-6">
              El enlace de recuperación no es válido o ha expirado.
            </p>
            <Link href="/login" className="btn-primary">
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[--emr-blue-10] to-[--emr-green-10] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-3 mb-6">
            <img src="/logo.png" alt="EarlyMarketReports" className="w-12 h-12 rounded" />
            <span className="text-2xl font-bold text-[--color-primary]">EarlyMarketReports</span>
          </Link>
          <h1 className="text-3xl font-bold text-[--color-primary] mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-600">
            Introduce tu nueva contraseña
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? "Restableciendo..." : "Restablecer Contraseña"}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-[--color-primary] hover:underline">
              ← Volver al Login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Tu información está protegida con encriptación SSL
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[--emr-blue-10] to-[--emr-green-10] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
