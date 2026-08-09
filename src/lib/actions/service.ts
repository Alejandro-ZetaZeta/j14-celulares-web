"use server";

import type { TechnicalService } from "@/types/database";
import { getTicketByCodeCached } from "@/lib/data/service";

/**
 * Fetch a service ticket by its public ticket_id code.
 * Accessible to anyone with the ticket code.
 *
 * Delegates to the cached data function in `@/lib/data/service`,
 * which is invalidated by `updateTag(`ticket-${id}`)` on admin mutations.
 */
export async function getTicketByCode(
  ticketId: string
): Promise<TechnicalService | null> {
  return getTicketByCodeCached(ticketId);
}
