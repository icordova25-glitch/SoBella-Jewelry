"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stockQuantity: string;
  isActive: boolean;
  imageUrlsText: string;
};

type AdminProductFormProps = {
  mode: "create" | "edit";
  initialValues?: ProductFormValues;
};

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  description: "",
  category: "",
  price: "",
  stockQuantity: "0",
  isActive: true,
  imageUrlsText: "",
};

export default function AdminProductForm({ mode, initialValues }: AdminProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initialValues || EMPTY_VALUES);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const imageUrls = useMemo(
    () => values.imageUrlsText.split("\n").map((line) => line.trim()).filter(Boolean),
    [values.imageUrlsText],
  );

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus("Uploading image...");
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch("/api/products/upload-image", {
      method: "POST",
      body: formData,
    });

    const uploadBody = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      setStatus(uploadBody.error || "Image upload failed.");
      return;
    }

    const nextUrls = [...imageUrls, String(uploadBody.url || "").trim()].filter(Boolean);
    setValues((current) => ({
      ...current,
      imageUrlsText: nextUrls.join("\n"),
    }));
    setStatus("Image uploaded.");
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(mode === "create" ? "Creating product..." : "Saving product...");

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category.trim(),
      price: Number(values.price),
      stock_quantity: Number(values.stockQuantity),
      is_active: values.isActive,
      image_urls: imageUrls,
    };

    const endpoint = mode === "create" ? "/api/admin/products" : `/api/admin/products/${values.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(body.error || "Unable to save product.");
      setIsSaving(false);
      return;
    }

    setStatus(mode === "create" ? "Product created." : "Product updated.");
    setIsSaving(false);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          required
        />
      </label>

      <label>
        Description
        <textarea
          rows={4}
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
        />
      </label>

      <div className="row-2">
        <label>
          Category
          <input
            value={values.category}
            onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
          />
        </label>

        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(event) => setValues((current) => ({ ...current, price: event.target.value }))}
            required
          />
        </label>
      </div>

      <div className="row-2">
        <label>
          Stock Quantity
          <input
            type="number"
            min="0"
            step="1"
            value={values.stockQuantity}
            onChange={(event) => setValues((current) => ({ ...current, stockQuantity: event.target.value }))}
            required
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
          />
          Active Product
        </label>
      </div>

      <label>
        Upload image
        <input type="file" accept="image/*" onChange={handleUpload} />
      </label>

      <label>
        Image URLs (one per line)
        <textarea
          rows={5}
          value={values.imageUrlsText}
          onChange={(event) => setValues((current) => ({ ...current, imageUrlsText: event.target.value }))}
          placeholder="https://..."
        />
      </label>

      <button className="cta" type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : mode === "create" ? "Create Product" : "Save Product"}
      </button>
      <p>{status}</p>
    </form>
  );
}
