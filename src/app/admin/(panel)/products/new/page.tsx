"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { ProductForm } from "src/features/admin/products/product-form";

export default function NewProductPage() {
  return (
    <PageShell title="Add product" description="Saved as JSON first — add gallery images from the edit page." backRoute={{ path: "/admin/products", label: "Back to products" }}>
      <ProductForm />
    </PageShell>
  );
}
