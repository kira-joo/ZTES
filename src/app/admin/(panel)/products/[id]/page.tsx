"use client";

import { productCrudEndpoints, type ProductEntity } from "src/common/api/admin-products.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageSection, PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use, useState } from "react";
import { ProductGalleryManager } from "src/components/admin/product-gallery-manager";
import { pickLocalized } from "src/lib/localized";
import { ProductForm } from "src/features/admin/products/product-form";

function ProductEditBody({ product }: { product: ProductEntity }) {
  const [images, setImages] = useState(product.images);

  return (
    <div className="flex flex-col gap-6">
      <ProductForm product={product} />
      <PageSection title="Gallery" description="One upload per request. Drag to reorder; the first image is the card's main photo.">
        <ProductGalleryManager productId={product._id} images={images} onChanged={setImages} />
      </PageSection>
    </div>
  );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: productCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell
      title={query.data ? pickLocalized(query.data.name, "en") : "Edit product"}
      backRoute={{ path: "/admin/products", label: "Back to products" }}
    >
      <QueryState query={query} entityName="Product" backRoute={{ path: "/admin/products", label: "Back to products" }}>
        {(product) => <ProductEditBody product={product} />}
      </QueryState>
    </PageShell>
  );
}
