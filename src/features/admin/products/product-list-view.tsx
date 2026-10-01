"use client";

import { brandCrudEndpoints, type BrandEntity } from "src/common/api/admin-brands.endpoints";
import { categoryCrudEndpoints, type CategoryEntity } from "src/common/api/admin-categories.endpoints";
import { productCrudEndpoints, productStatusEndpoint, type ProductBrandSummary, type ProductEntity } from "src/common/api/admin-products.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { CustomSwitch } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { FeatureFilterType, FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { formatAmount } from "src/lib/money";
import { pickLocalized } from "src/lib/localized";

function ActiveToggle({ product, onChanged }: { product: ProductEntity; onChanged: () => void }) {
  const mutation = useRequesterMutation({ endpoint: productStatusEndpoint });
  return (
    <CustomSwitch
      checked={product.isActive}
      aria-label={product.isActive ? "Deactivate product" : "Activate product"}
      onChange={async (checked) => {
        await mutation.mutateAsync({ params: { id: product._id }, body: { isActive: checked } });
        onChanged();
      }}
    />
  );
}

export function ProductListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: productCrudEndpoints.delete });

  const columns: TableColumn<ProductEntity>[] = [
    {
      key: "images",
      header: "",
      render: (row) =>
        row.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
          <img src={row.images[0].secureUrl} alt="" className="size-10 rounded object-cover" />
        ) : (
          <div className="size-10 rounded bg-slate-100" aria-hidden="true" />
        ),
    },
    { key: "name", header: "Name", sortable: true, render: (row) => pickLocalized(row.name, "en") },
    { key: "sku", header: "SKU", render: (row) => row.sku ?? "—" },
    {
      key: "brand",
      header: "Brand",
      render: (row) => (row.brand && typeof row.brand !== "string" ? pickLocalized((row.brand as ProductBrandSummary).name, "en") : "—"),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => (
        <span className="flex flex-col">
          <span>{formatAmount(row.price, "en")} SAR</span>
          {row.compareAtPrice && <span className="text-xs text-slate-400 line-through">{formatAmount(row.compareAtPrice, "en")} SAR</span>}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      sortable: true,
      render: (row) => (!row.trackStock ? "∞" : row.stock <= 0 ? <span className="font-medium text-red-600">0</span> : row.stock),
    },
    { key: "isActive", header: "Active", render: (row) => <ActiveToggle product={row} onChanged={() => tableRef.current?.refetch()} /> },
  ];

  return (
    <PageShell
      title="Products"
      description="Everything customers can browse and buy."
      actions={
        <RouteButton path="/admin/products/new" leftIcon={Plus}>
          Add product
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={productCrudEndpoints.get}
        columns={columns}
        entityName="Product"
        searchPlaceholder="Search by name or SKU…"
        filters={[
          {
            type: FeatureFilterType.SELECT,
            key: "isActive",
            header: "Status",
            options: [
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
          {
            type: FeatureFilterType.SELECT,
            key: "stockLevel",
            header: "Stock",
            options: [
              { label: "Low (≤ 5)", value: "low" },
              { label: "Out of stock", value: "out" },
            ],
          },
          {
            type: FeatureFilterType.COMBOBOX,
            queryKey: "brand",
            endpoint: brandCrudEndpoints.get,
            optionLabel: (item) => pickLocalized((item as unknown as BrandEntity).name, "en"),
            optionValue: (item) => (item as unknown as BrandEntity)._id,
            placeholder: "Any brand",
          },
          {
            type: FeatureFilterType.COMBOBOX,
            queryKey: "categories",
            endpoint: categoryCrudEndpoints.get,
            optionLabel: (item) => pickLocalized((item as unknown as CategoryEntity).name, "en"),
            optionValue: (item) => (item as unknown as CategoryEntity)._id,
            placeholder: "Any category",
          },
        ]}
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/products/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({
              title: `Delete "${pickLocalized(subject.name, "en")}"?`,
              description: "Soft-deleted — past orders keep their snapshot.",
              destructive: true,
            }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
