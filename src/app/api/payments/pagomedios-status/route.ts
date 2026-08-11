import { NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("order");
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return NextResponse.json({ error: "Orden inválida." }, { status: 400 });
  const { data, error } = await insforgeAdmin.database.from("orders").select("id, status").eq("id", orderId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  return NextResponse.json({ orderId: data.id, status: data.status });
}
