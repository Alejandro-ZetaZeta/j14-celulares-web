import { NextResponse } from "next/server";
import { calculatePromotion } from "@/lib/promotions";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string; items?: { variantId: string; quantity: number }[] };
    if (!body.code || !Array.isArray(body.items)) return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    const result = await calculatePromotion(body.code, body.items);
    return "error" in result ? NextResponse.json(result, { status: 400 }) : NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "No se pudo validar la promoción." }, { status: 500 });
  }
}
