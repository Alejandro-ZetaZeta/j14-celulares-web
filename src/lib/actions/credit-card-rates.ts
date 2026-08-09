"use server";

import { updateTag, revalidatePath } from "next/cache";
import { getAdminDatabase } from "@/lib/insforge-server";
import type { CreditCardRate } from "@/types/database";

export async function getCreditCardRatesAdmin(): Promise<CreditCardRate[]> {
  const db = await getAdminDatabase();
  const { data, error } = await db
    .from("credit_card_rates")
    .select("id, months, interest_multiplier, active, created_at")
    .order("months", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as CreditCardRate[]) ?? [];
}

export async function createCreditCardRate(
  months: number,
  interestMultiplier: number
): Promise<CreditCardRate> {
  const db = await getAdminDatabase();
  const { data, error } = await db
    .from("credit_card_rates")
    .insert([{ months, interest_multiplier: interestMultiplier }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/financiamiento");
  updateTag("credit-card-rates");
  return data as CreditCardRate;
}

export async function updateCreditCardRate(
  id: string,
  updates: Partial<Pick<CreditCardRate, "months" | "interest_multiplier" | "active">>
) {
  const db = await getAdminDatabase();
  const { error } = await db
    .from("credit_card_rates")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/financiamiento");
  updateTag("credit-card-rates");
}

export async function deleteCreditCardRate(id: string) {
  const db = await getAdminDatabase();
  const { error } = await db
    .from("credit_card_rates")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/financiamiento");
  updateTag("credit-card-rates");
}
