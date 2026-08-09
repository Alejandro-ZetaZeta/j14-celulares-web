"use server";

import { updateTag } from "next/cache";
import { getAdminDatabase } from "@/lib/insforge-server";
import type { CatalogCollection } from "@/types/database";

export type CollectionInput = Omit<CatalogCollection, "id" | "created_at">;

export async function getAllCollections(): Promise<CatalogCollection[]> {
  const db = await getAdminDatabase();
  const { data, error } = await db
    .from("catalog_collections")
    .select("id, slug, label, description, match_type, match_value, show_as_chip, show_on_home, pin_order, is_active, created_at")
    .order("pin_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogCollection[];
}

export async function createCollection(input: CollectionInput) {
  const db = await getAdminDatabase();
  const { data, error } = await db.from("catalog_collections").insert([input]).select().single();
  if (error) throw new Error(error.message);
  updateTag("collections");
  return data as CatalogCollection;
}

export async function updateCollection(id: string, input: Partial<CollectionInput>) {
  const db = await getAdminDatabase();
  const { error } = await db.from("catalog_collections").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("collections");
}

export async function deleteCollection(id: string) {
  const db = await getAdminDatabase();
  const { error } = await db.from("catalog_collections").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag("collections");
}
