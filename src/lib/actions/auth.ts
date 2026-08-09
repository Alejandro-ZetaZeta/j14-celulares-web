"use server";

import { cookies } from "next/headers";
import { createAuthActions, createServerClient } from "@insforge/sdk/ssr";
import type { AppRole } from "@/lib/auth/roles";
import { isStrongPassword } from "@/lib/auth/password";

const PENDING_PROFILE_COOKIE = "client_pending_profile";
const CURRENT_TERMS_VERSION = "2026-08";

function safeError(error: { message?: string } | null) {
  return error ? { message: error.message ?? "Error de autenticación." } : null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function authUserExists(email: string) {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) return false;

  try {
    const response = await fetch(`${baseUrl}/api/auth/users?search=${encodeURIComponent(email)}&limit=50`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = await response.json() as { data?: Array<{ email?: string }> };
    return payload.data?.some((user) => normalizeEmail(user.email ?? "") === email) ?? false;
  } catch {
    return false;
  }
}

/**
 * Sign in via Server Action so the session cookies (access + refresh)
 * are set server-side and picked up by the proxy on the next request.
 */
export async function signInAction(formData: FormData) {
  const auth = createAuthActions({ cookies: await cookies() });

  const { data, error } = await auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });

  if (error || !data?.user) {
    return { user: null, role: null, error: safeError(error) };
  }

  const client = createServerClient({ cookies: await cookies() });
  const { data: profile } = await client.database
    .from("user_profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return {
    user: data.user,
    role: (profile?.role as AppRole) ?? null,
    error: null,
  };
}

export async function signInClientAction(formData: FormData) {
  return signInAction(formData);
}

export async function registerClientAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !fullName || fullName.length > 100 || !/^\d{1,10}$/.test(phone) || !isStrongPassword(password)) {
    return {
      user: null,
      requiresVerification: false,
      error: { message: "Completa todos los campos y usa una contraseña robusta." },
    };
  }

  if (await authUserExists(email)) {
    return {
      user: null,
      requiresVerification: false,
      error: { message: "Este correo ya está registrado. Inicia sesión o recupera tu contraseña." },
    };
  }

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  const { data, error } = await auth.signUp({
    email,
    password,
    name: fullName,
  });

  if (error) {
    return {
      user: null,
      requiresVerification: false,
      error: safeError(error),
    };
  }

  const requiresVerification = data?.requireEmailVerification === true;
  if (!data || (!data.user && !requiresVerification)) {
    return {
      user: null,
      requiresVerification: false,
      error: { message: "No pudimos crear tu cuenta." },
    };
  }

  cookieStore.set(PENDING_PROFILE_COOKIE, JSON.stringify({ fullName, phone }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 900,
  });

  if (requiresVerification) {
    return { user: data.user, requiresVerification: true, error: null };
  }

  await savePendingClientProfile();
  return { user: data.user, requiresVerification: false, error: null };
}

export async function verifyClientEmailAction(email: string, otp: string) {
  if (!/^\d{6}$/.test(otp)) {
    return { error: { message: "El código debe tener 6 dígitos." } };
  }

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.verifyEmail({ email: email.trim().toLowerCase(), otp });
  if (error || !data?.user) {
    return { error: safeError(error) ?? { message: "No pudimos verificar el código." } };
  }

  await savePendingClientProfile();
  return { error: null };
}

export async function resendClientVerificationAction(email: string) {
  const auth = createServerClient({ cookies: await cookies() }).auth;
  const { error } = await auth.resendVerificationEmail({ email: email.trim().toLowerCase() });
  return { error: safeError(error) };
}

export async function acceptClientTermsAction() {
  const client = createServerClient({ cookies: await cookies() });
  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user) return { error: { message: "Sesión no válida." } };

  const { data: profile, error: profileError } = await client.database.from("user_profiles").select("role, terms_accepted_at").eq("id", userData.user.id).single();
  if (profileError) return { error: safeError(profileError) };
  if (profile?.role !== "client") return { error: { message: "Solo cuentas de cliente pueden aceptar estos términos aquí." } };
  if (profile.terms_accepted_at) return { error: null };

  const { data: updatedProfile, error } = await client.database.from("user_profiles").update({
    terms_accepted_at: new Date().toISOString(),
    terms_version: CURRENT_TERMS_VERSION,
  }).eq("id", userData.user.id).eq("role", "client").select("id").maybeSingle();

  if (!error && !updatedProfile) return { error: { message: "No se pudo guardar la aceptación. Verifica que tu sesión siga activa." } };
  return { error: safeError(error) };
}

export async function requestPasswordResetAction(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { email: null, error: { message: "Ingresa un correo electrónico válido." } };
  }

  if (!(await authUserExists(email))) {
    return { email: null, error: { message: "No encontramos una cuenta con ese correo." } };
  }

  const client = createServerClient({ cookies: await cookies() });
  const { error } = await client.auth.sendResetPasswordEmail({ email });
  if (error) return { email: null, error: safeError(error) };
  return { email, error: null };
}

export async function exchangePasswordResetTokenAction(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !/^\d{6}$/.test(code)) {
    return { token: null, error: { message: "Ingresa un correo válido y un código de 6 dígitos." } };
  }

  const client = createServerClient({ cookies: await cookies() });
  const { data, error } = await client.auth.exchangeResetPasswordToken({ email: normalizedEmail, code });
  if (error || !data?.token) {
    return { token: null, error: safeError(error) ?? { message: "El código es incorrecto o ya expiró." } };
  }
  return { token: data.token, error: null };
}

export async function resetPasswordAction(newPassword: string, token: string) {
  if (!isStrongPassword(newPassword) || !token) {
    return { error: { message: "Usa una contraseña que cumpla todos los requisitos." } };
  }

  const client = createServerClient({ cookies: await cookies() });
  const { error } = await client.auth.resetPassword({ newPassword, otp: token });
  return { error: safeError(error) };
}

async function savePendingClientProfile() {
  const cookieStore = await cookies();
  const pending = cookieStore.get(PENDING_PROFILE_COOKIE)?.value;
  if (!pending) return;

  let profile: { fullName: string; phone: string };
  try {
    profile = JSON.parse(pending) as { fullName: string; phone: string };
  } catch {
    return;
  }

  const client = createServerClient({ cookies: cookieStore });
  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user) return;

  await client.database
    .from("user_profiles")
    .update({ full_name: profile.fullName, phone: profile.phone })
    .eq("id", userData.user.id);

  cookieStore.delete(PENDING_PROFILE_COOKIE);
}

export async function updateClientProfileAction(formData: FormData) {
  const client = createServerClient({ cookies: await cookies() });
  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user) return { error: { message: "Sesión no válida." } };

  const cedula = String(formData.get("cedula") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? new Date(`${dateOfBirth}T00:00:00Z`) : null;
  const today = new Date();
  const age = parsedDate ? today.getUTCFullYear() - parsedDate.getUTCFullYear() - (
    today.getUTCMonth() < parsedDate.getUTCMonth() ||
    (today.getUTCMonth() === parsedDate.getUTCMonth() && today.getUTCDate() < parsedDate.getUTCDate()) ? 1 : 0
  ) : 0;

  if (!/^\d{1,10}$/.test(cedula) || !parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate > today || age < 18 || age > 120 || address.length > 250) {
    return { error: { message: "Ingresa una cédula válida y una fecha de nacimiento válida para mayores de 18 años." } };
  }

  const { data: updatedProfile, error } = await client.database
    .from("user_profiles")
    .update({ cedula, date_of_birth: dateOfBirth, address: address || null, is_profile_completed: true })
    .eq("id", userData.user.id)
    .eq("role", "client")
    .select("id")
    .maybeSingle();

  if (!error && !updatedProfile) return { error: { message: "No se pudo actualizar tu perfil. Verifica que tu sesión siga activa." } };

  return { error: safeError(error) };
}

export async function initiateClientGoogleAction() {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await auth.signInWithOAuth("google", {
    redirectTo: new URL("/api/auth/callback", appUrl).toString(),
    skipBrowserRedirect: true,
    additionalParams: { prompt: "select_account" },
  });

  if (error || !data?.url || !data.codeVerifier) {
    return { url: null, error: safeError(error) ?? { message: "Google OAuth no está disponible." } };
  }

  cookieStore.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return { url: data.url, error: null };
}

/**
 * Sign out via Server Action so the session cookies are cleared server-side.
 */
export async function signOutAction() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
}
