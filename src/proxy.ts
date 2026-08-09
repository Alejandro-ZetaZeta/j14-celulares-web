import { NextResponse, type NextRequest } from "next/server";
import { updateSession, type CookieOptions } from "@insforge/sdk/ssr/middleware";
import { createServerClient } from "@insforge/sdk/ssr";

/**
 * Next.js 16 Proxy — replaces middleware.ts
 * Keeps the InsForge session alive on every request and protects /admin/* routes.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  function redirect(path: string) {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.headers.getSetCookie()) {
      redirectResponse.headers.append("set-cookie", cookie);
    }
    return redirectResponse;
  }

  // Refresh the access token cookie if it's near expiry.
  // We wrap the Next.js cookie objects in adapters that satisfy the SDK's
  // CookieStore interface. Method shorthands with union params are required
  // because TypeScript won't accept arrow functions for overloaded interface methods.
  const session = await updateSession({
    requestCookies: {
      get: (name: string) => request.cookies.get(name),
      set(nameOrOpts: string | { name: string; value: string }, value?: string) {
        if (typeof nameOrOpts === "string") request.cookies.set(nameOrOpts, value!);
        else request.cookies.set(nameOrOpts.name, nameOrOpts.value);
      },
      delete(nameOrOpts: string | { name: string }) {
        request.cookies.delete(typeof nameOrOpts === "string" ? nameOrOpts : nameOrOpts.name);
      },
    },
    responseCookies: {
      get(name: string) {
        return response.cookies.get(name);
      },
      set(nameOrOpts: string | ({ name: string; value: string } & CookieOptions), value?: string) {
        if (typeof nameOrOpts === "string") response.cookies.set(nameOrOpts, value!);
        else {
          const { name, value: cookieValue, ...options } = nameOrOpts;
          response.cookies.set(name, cookieValue, options);
        }
      },
      delete(nameOrOpts: string | ({ name: string } & CookieOptions)) {
        response.cookies.delete(typeof nameOrOpts === "string" ? nameOrOpts : nameOrOpts.name);
      },
    },
  });

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = pathname.startsWith("/cliente");
  const isAdminLogin = pathname === "/admin/login";
  const isClientPublic = ["/cliente/login", "/cliente/registro", "/cliente/verificar-otp", "/cliente/recuperar-password", "/cliente/restablecer-password"].includes(pathname);
  const isTermsAcceptanceRoute = pathname === "/cliente/aceptar-terminos";

  if ((!isAdminRoute || isAdminLogin) && (!isClientRoute || isClientPublic)) {
    return response;
  }

  const accessToken = session.accessToken ?? request.cookies.get("insforge_access_token")?.value;

  if (!accessToken) {
    const loginUrl = new URL(isClientRoute ? "/cliente/login" : "/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return redirect(loginUrl.pathname + loginUrl.search);
  }

  const client = createServerClient({
    cookies: { get: (name: string) => request.cookies.get(name) },
  });
  const { data: authData } = await client.auth.getCurrentUser();
  if (!authData?.user) {
    const loginUrl = new URL(isClientRoute ? "/cliente/login" : "/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return redirect(loginUrl.pathname + loginUrl.search);
  }

  const { data: profile } = await client.database
    .from("user_profiles")
    .select("role, is_profile_completed, date_of_birth")
    .eq("id", authData.user.id)
    .single();
  const role = profile?.role as "admin" | "technician" | "client" | undefined;

  if (isClientRoute) {
    if (role === "technician") return redirect("/admin/servicio-tecnico");
    if (role !== "client" && role !== "admin") return redirect("/cliente/login");
    if (role === "client" && (!profile?.is_profile_completed || !profile?.date_of_birth) && pathname !== "/cliente/completar-perfil" && !isTermsAcceptanceRoute) {
      return redirect("/cliente/completar-perfil");
    }
    if (role === "client" && profile?.is_profile_completed && pathname === "/cliente/completar-perfil") {
      return redirect("/cliente/dashboard");
    }
  }

  if (isAdminRoute && !isAdminLogin) {
    if (role === "client") return redirect("/cliente/dashboard");
    if (role === "technician" && !pathname.startsWith("/admin/servicio-tecnico")) {
      return redirect("/admin/servicio-tecnico");
    }
    if (!role) return redirect("/admin/login");
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/cliente/:path*"],
};
