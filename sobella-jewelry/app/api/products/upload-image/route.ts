import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase service credentials are required" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const filePath = `products/${Date.now()}-${file.name}`;
    const uploadResult = await supabase.storage.from("product-images").upload(filePath, file, { upsert: true });

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 400 });
    }

    const publicResult = supabase.storage.from("product-images").getPublicUrl(filePath);
    return NextResponse.json({ path: filePath, url: publicResult.data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
