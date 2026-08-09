import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const failure = new URL("/cliente/login", request.url);

  if (oauthError || !code) {
    failure.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(failure);
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("insforge_code_verifier")?.value;
  if (!verifier) {
    failure.searchParams.set("error", "missing_verifier");
    return NextResponse.redirect(failure);
  }

   const response = NextResponse.redirect(new URL("/cliente/aceptar-terminos", request.url));
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });
  const { data, error } = await auth.exchangeOAuthCode(code, verifier);

  if (error || !data?.user) {
    failure.searchParams.set("error", "oauth_exchange_failed");
    return NextResponse.redirect(failure);
  }

  response.cookies.delete("insforge_code_verifier");
  return response;
}
