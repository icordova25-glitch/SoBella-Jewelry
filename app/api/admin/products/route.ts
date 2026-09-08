import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreateProductBody = {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  stock_quantity?: number;
  is_active?: boolean;
  image_urls?: string[];
};

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase service credentials are required" }, { status: 500 });
    }

    const body = (await request.json()) as CreateProductBody;
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim() || null;
    const category = String(body.category || "").trim() || null;
    const price = Number(body.price);
    const stockQuantity = Number(body.stock_quantity ?? 0);
    const isActive = Boolean(body.is_active ?? true);
    const imageUrls = Array.isArray(body.image_urls)
      ? body.image_urls.map((url) => String(url || "").trim()).filter(Boolean)
      : [];

    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description,
        category,
        price,
        stock_quantity: stockQuantity,
        is_active: isActive,
        image_urls: imageUrls,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
