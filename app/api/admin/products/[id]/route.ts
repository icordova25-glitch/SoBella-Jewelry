import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UpdateProductBody = {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  stock_quantity?: number;
  is_active?: boolean;
  image_urls?: string[];
};

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service credentials are required" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, category, price, stock_quantity, is_active, image_urls")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase service credentials are required" }, { status: 500 });
    }

    const body = (await request.json()) as UpdateProductBody;
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
      .update({
        name,
        description,
        category,
        price,
        stock_quantity: stockQuantity,
        is_active: isActive,
        image_urls: imageUrls,
      })
      .eq("id", id)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Unable to update product" }, { status: 400 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
