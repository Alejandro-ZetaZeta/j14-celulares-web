import { cacheTag, cacheLife } from "next/cache";
import { insforge } from "@/lib/insforge";
import type { TechnicalService } from "@/types/database";

/**
 * Fetch a service ticket by its public ticket_id code.
 * Accessible to anyone with the ticket code.
 *
 * Cached per ticket_id; invalidated via `updateTag(`ticket-${ticketId}`)`
 * from admin mutations in `src/lib/actions/admin-service.ts`.
 * `cacheLife("max")` disables time-based expiry — cache stays valid
 * until an admin action explicitly invalidates the tag.
 */
export async function getTicketByCodeCached(
  ticketId: string
): Promise<TechnicalService | null> {
  "use cache";
  const normalized = ticketId.trim().toUpperCase();
  cacheTag(`ticket-${normalized}`);
  cacheLife("max");

  const { data, error } = await insforge.database.rpc("lookup_ticket_by_code", {
    p_ticket_id: normalized,
  }).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[getTicketByCodeCached] Error:", error.message);
    return null;
  }

  return data as TechnicalService;
}
