import { createAdminClient } from '@insforge/sdk';

/**
 * Admin InsForge client — server-side ONLY (Server Actions / Route Handlers).
 * Bypasses RLS using the service-role API key.
 * NEVER import this in any client component or expose to the browser.
 */
export const insforgeAdmin = createAdminClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  apiKey: process.env.INSFORGE_API_KEY!,
});
