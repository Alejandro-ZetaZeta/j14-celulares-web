import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;

/**
 * Public InsForge client — used in client components, server components, and SSR.
 * Row Level Security (RLS) policies are fully enforced.
 * Never exposes IMEI or admin-only data.
 */
export const insforge = createClient({
  baseUrl,
  anonKey,
});
