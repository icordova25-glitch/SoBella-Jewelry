"use client";

import { useState } from "react";

export default function ImageUploader() {
  const [status, setStatus] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/products/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setStatus(body.error || "Upload failed.");
      return;
    }

    const data = await response.json();
    setStatus(`Uploaded: ${data.url}`);
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleUpload} />
      <p>{status}</p>
    </div>
  );
}
