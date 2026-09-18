/**
 * AdModalLoader — Server component.
 *
 * Fetches visible ads server-side and passes them to the client-side AdModal.
 * Wrapped in Suspense in the public layout so it never blocks the page render.
 * If no ads exist (or the query fails), the modal simply won't show.
 *
 * `connection()` opts this out of static prerendering — ad data is live and
 * must be fetched at request time.
 */

import { connection } from "next/server";
import { getVisibleAds } from "@/lib/actions/admin-ads";
import AdModal from "./AdModal";

export default async function AdModalLoader() {
  // Opt out of static rendering — ads data changes over time.
  await connection();

  let ads;
  try {
    ads = await getVisibleAds();
  } catch {
    // Silently suppress errors — the modal is non-critical
    return null;
  }

  if (!ads || ads.length === 0) return null;

  return <AdModal ads={ads} />;
}

