"use client";

import { brandCrudEndpoints, type BrandEntity } from "api/admin-brands.endpoints";
import { categoryCrudEndpoints, type CategoryEntity } from "api/admin-categories.endpoints";
import { productCrudEndpoints, type ProductEntity, type ProductFormValues } from "api/admin-products.endpoints";
import { CustomForm, FieldType, renderFormField, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { CustomCheckbox } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { CustomSelect } from "@kira-joo/frontend-toolkit-tailwind/select";
import { PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { toNumber, toNumberOrUndefined } from "src/components/admin/form-number";
import { ProductOptionsEditor } from "src/components/admin/product-options-editor";
import { QuantityTiersEditor } from "src/components/admin/quantity-tiers-editor";
import { SlugFields } from "src/components/admin/slug-fields";
import { pickLocalized } from "src/lib/localized";

const EMPTY_LOCALIZED = { ar: "", en: "" };

/** `badgeEnabled` is a form-only flag — never sent, never part of `ProductFormValues`. */
interface ProductFormState extends ProductFormValues {
  badgeEnabled: boolean;
}

const BADGE_TONE_OPTIONS = [
  { label: "Primary", value: "PRIMARY" },
  { label: "Sale", value: "SALE" },
  { label: "Neutral", value: "NEUTRAL" },
  { label: "Dark", value: "DARK" },
];

function toFormValues(product?: ProductEntity): ProductFormState {
  if (!product) {
    return {
      name: EMPTY_LOCALIZED,
      slug: EMPTY_LOCALIZED,
      description: EMPTY_LOCALIZED,
      sku: "",
      brand: null,
      categories: [],
      primaryCategory: null,
      price: "",
      compareAtPrice: "",
      saleEndsAt: "",
      stock: 0,
      trackStock: true,
      weight: EMPTY_LOCALIZED,
      options: [],
      // Always a real object in FORM state, even though the wire value is
      // nullable — RHF cannot register nested paths (`badge.label.ar`, ...)
      // under a `null` parent, which left the badge inputs uncontrolled
      // (`value` prop warning) and submitted blank/undefined leaf values
      // that failed the DTO's string validators. `badgeEnabled` alone
      // decides whether `toBody` sends this object or `null`.
      badge: { label: EMPTY_LOCALIZED, tone: "PRIMARY" },
      badgeEnabled: false,
      quantityTiers: [],
      isActive: true,
      isFeatured: false,
      sortOrder: 0,
      seo: { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku ?? "",
    brand: typeof product.brand === "string" ? product.brand : (product.brand?._id ?? null),
    categories: product.categories,
    primaryCategory: product.primaryCategory,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? "",
    saleEndsAt: product.saleEndsAt ?? "",
    stock: product.stock,
    trackStock: product.trackStock,
    weight: product.weight,
    options: product.options,
    badge: product.badge ?? { label: EMPTY_LOCALIZED, tone: "PRIMARY" },
    badgeEnabled: Boolean(product.badge),
    quantityTiers: product.quantityTiers,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    seo: product.seo ?? { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
  };
}

function toBody(values: ProductFormState, form: UseFormReturn<ProductFormState>): ProductFormValues {
  const all = form.getValues();
  return {
    ...values,
    slug: all.slug,
    description: all.description,
    weight: all.weight,
    badge: all.badgeEnabled ? { label: all.badge!.label, tone: all.badge!.tone } : null,
    quantityTiers: (all.quantityTiers ?? []).map((tier) => ({
      minQuantity: toNumber(tier.minQuantity, 2),
      percent: toNumber(tier.percent, 1),
    })),
    options: (all.options ?? []).map((group) => ({
      ...group,
      values: group.values.map((value) => ({ ...value, priceDelta: value.priceDelta || "0" })),
    })),
    isActive: all.isActive,
    isFeatured: all.isFeatured,
    sortOrder: toNumber(all.sortOrder),
    seo: all.seo,
    compareAtPrice: values.compareAtPrice || null,
    saleEndsAt: values.saleEndsAt || null,
    stock: toNumberOrUndefined(values.stock),
    brand: values.brand || null,
    primaryCategory: values.primaryCategory || null,
  };
}

export interface ProductFormProps {
  product?: ProductEntity;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ProductFormState>({ defaultValues: toFormValues(product) });
  const badgeEnabled = useWatch({ control: form.control, name: "badgeEnabled" });

  const sections: FormSection<ProductFormState>[] = [
    {
      title: "Basics",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "name", label: "Name", rules: { required: "Required" }, colSpan: "full" },
        { type: FieldType.INPUT, name: "sku", label: "SKU" },
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "brand",
          label: "Brand",
          endpoint: brandCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as BrandEntity).name, "en"),
          optionValue: (item) => (item as unknown as BrandEntity)._id,
          query: { limit: 100 },
        },
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "categories",
          label: "Categories",
          multiple: true,
          endpoint: categoryCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as CategoryEntity).name, "en"),
          optionValue: (item) => (item as unknown as CategoryEntity)._id,
          query: { limit: 100 },
          colSpan: "full",
        },
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "primaryCategory",
          label: "Primary category",
          description: "Drives the breadcrumb and the related-products rail.",
          endpoint: categoryCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as CategoryEntity).name, "en"),
          optionValue: (item) => (item as unknown as CategoryEntity)._id,
          query: { limit: 100 },
        },
      ],
    },
    {
      title: "Pricing",
      fields: [
        { type: FieldType.INPUT, name: "price", label: "Price", rules: { required: "Required" }, description: "e.g. 89 or 89.50" },
        { type: FieldType.INPUT, name: "compareAtPrice", label: "Compare-at price", placeholder: "No compare price" },
        { type: FieldType.DATE, name: "saleEndsAt", label: "Sale ends", includeTime: true },
      ],
    },
    {
      title: "Stock",
      fields: [
        { type: FieldType.INPUT, name: "stock", label: "Stock", inputType: "number" },
        { type: FieldType.SWITCH, name: "trackStock", label: "Track stock" },
      ],
    },
  ];

  const children = (
    <>
      <PageSection title="Slug">
        <SlugFields control={form.control} setValue={form.setValue} getValues={form.getValues} nameField="name" slugField="slug" />
      </PageSection>

      <PageSection title="Description">
        <FormLocalizedRichText control={form.control} name="description" />
      </PageSection>

      <PageSection title="Weight">
        {renderFormField({ type: FieldType.LOCALIZED_INPUT, name: "weight", label: "Weight", placeholder: "e.g. 1 kg" }, form)}
      </PageSection>

      <PageSection title="Badge" description="An optional ribbon shown on the product card.">
        <div className="flex flex-col gap-4">
          <Controller
            control={form.control}
            name="badgeEnabled"
            render={({ field }) => (
              <CustomCheckbox label="Show a badge" checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />
            )}
          />
          {badgeEnabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {renderFormField({ type: FieldType.LOCALIZED_INPUT, name: "badge.label", label: "Badge text", colSpan: 2 }, form)}
              <Controller
                control={form.control}
                name="badge.tone"
                render={({ field }) => (
                  <CustomSelect label="Tone" options={BADGE_TONE_OPTIONS} value={(field.value as string) ?? "PRIMARY"} onChange={field.onChange} />
                )}
              />
            </div>
          )}
        </div>
      </PageSection>

      <PageSection title="Quantity discounts" description="e.g. buy 3 or more and save 10%.">
        <QuantityTiersEditor control={form.control} name="quantityTiers" />
      </PageSection>

      <PageSection title="Options" description="Choices like size or color, each with its own values.">
        <ProductOptionsEditor control={form.control} name="options" />
      </PageSection>

      <PageSection title="Flags">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {renderFormField({ type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" }, form)}
          {renderFormField({ type: FieldType.SWITCH, name: "isActive", label: "Active" }, form)}
          {renderFormField({ type: FieldType.SWITCH, name: "isFeatured", label: "Featured" }, form)}
        </div>
      </PageSection>

      <PageSection title="SEO">
        <div className="grid grid-cols-1 gap-4">
          {renderFormField({ type: FieldType.LOCALIZED_INPUT, name: "seo.title", label: "Meta title" }, form)}
          {renderFormField({ type: FieldType.LOCALIZED_TEXTAREA, name: "seo.description", label: "Meta description", rows: 3 }, form)}
        </div>
      </PageSection>
    </>
  );

  const handleSuccess = (saved: ProductEntity) => {
    toast.success(product ? "Product updated" : "Product created — add gallery images below.");
    void queryClient.invalidateQueries();
    router.push(`/admin/products/${saved._id}`);
  };

  if (product) {
    return (
      <CustomForm<ProductFormState, typeof productCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={productCrudEndpoints.update}
        submitParams={{ id: product._id }}
        transformValues={(values) => toBody(values, form) as never}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<ProductFormState, typeof productCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={productCrudEndpoints.create}
      transformValues={(values) => toBody(values, form) as never}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
