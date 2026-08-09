"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInAction } from "@/lib/actions/auth";
import PasswordVisibilityButton from "@/components/client/PasswordVisibilityButton";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    const result = await signInAction(formData);

    setLoading(false);

    if (result.error || !result.user) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }

    // Admins always start from dashboard. Technicians remain limited to service.
    const home = result.role === "technician" ? "/admin/servicio-tecnico" : "/admin";
    router.push(home);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-6 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--accent)] hover:underline"
          >
            <span aria-hidden="true">←</span>
            Volver al sitio público
          </button>
          <Image
            src="/J14_Icono_Azul.jpg"
            alt="J14 Celulares"
            width={56}
            height={56}
            className="rounded-full object-cover mx-auto mb-4"
          />
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Panel Administrativo</h1>
          <p className="text-caption mt-1">J14 Celulares — Acceso exclusivo</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-md)] p-8 flex flex-col gap-5"
        >
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-[var(--radius-md)] px-4 py-3 text-[14px]"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-[14px] font-medium text-[var(--text-primary)]">
              Correo electrónico
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
              autoComplete="email"
              className="px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-[15px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-[14px] font-medium text-[var(--text-primary)]">
              Contraseña
            </label>
            <span className="relative block">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-[15px]"
              />
              <PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
            </span>
          </div>

          <button
            type="submit"
            id="admin-login-submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : null}
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
