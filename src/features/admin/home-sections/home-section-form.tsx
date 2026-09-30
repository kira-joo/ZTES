"use client";

import { brandCrudEndpoints, type BrandEntity } from "api/admin-brands.endpoints";
import { categoryCrudEndpoints, type CategoryEntity } from "api/admin-categories.endpoints";
import {
  homeSectionCrudEndpoints,
  type HomeSectionEntity,
  type HomeSectionFormValues,
  type HomeSectionType,
} from "api/admin-home-sections.endpoints";
import { productCrudEndpoints, type ProductEntity } from "api/admin-products.endpoints";
import { CustomForm, FieldType, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { CustomButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toNumber, toNumberOrUndefined } from "src/components/admin/form-number";
import { pickLocalized } from "src/lib/localized";
import { bannerImagePolicy } from "src/server/core/assets/upload-policies";

const EMPTY_LOCALIZED = { ar: "", en: "" };

const TYPE_OPTIONS = [
  { label: "Hero slider", value: "HERO_SLIDER" },
  { label: "Tile row", value: "TILE_ROW" },
  { label: "Banner", value: "BANNER" },
  { label: "Brand carousel", value: "BRAND_CAROUSEL" },
  { label: "Spotlight", value: "SPOTLIGHT" },
  { label: "Product rail", value: "PRODUCT_RAIL" },
  { label: "Trust strip", value: "TRUST_STRIP" },
  { label: "Social links", value: "SOCIAL_LINKS" },
  { label: "FAQ", value: "FAQ" },
  { label: "Blog rail", value: "BLOG_RAIL" },
  { label: "Testimonials", value: "TESTIMONIALS" },
  { label: "Branch map", value: "BRANCH_MAP" },
];

const MEDIA_ITEMS_TYPES = new Set<HomeSectionType>(["HERO_SLIDER", "TILE_ROW", "BANNER", "TRUST_STRIP"]);
const LIMIT_TYPES = new Set<HomeSectionType>(["FAQ", "TESTIMONIALS", "BLOG_RAIL"]);

function toFormValues(section?: HomeSectionEntity): HomeSectionFormValues {
  if (!section) {
    return { type: "HERO_SLIDER", title: EMPTY_LOCALIZED, sortOrder: 0, isActive: true, payload: { items: [] } };
  }
  return {
    type: section.type,
    title: section.title ?? EMPTY_LOCALIZED,
    sortOrder: section.sortOrder,
    isActive: section.isActive,
    payload: section.payload ?? {},
  };
}

export interface HomeSectionFormProps {
  section?: HomeSectionEntity;
}

export function HomeSectionForm({ section }: HomeSectionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<HomeSectionFormValues>({ defaultValues: toFormValues(section) });
  const type = useWatch({ control: form.control, name: "type" });
  const source = useWatch({ control: form.control, name: "payload.source" });
  const items = useWatch({ control: form.control, name: "payload.items" }) ?? [];

  const baseSection: FormSection<HomeSectionFormValues> = {
    title: "Section",
    fields: [
      { type: FieldType.SELECT, name: "type", label: "Type", options: TYPE_OPTIONS, disabled: Boolean(section), rules: { required: "Required" } },
      { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title", description: "Shown as the section heading, where the storefront renders one." },
      { type: FieldType.INPUT, name: "sortOrder", label: "Sort order", inputType: "number" },
      { type: FieldType.SWITCH, name: "isActive", label: "Active" },
    ],
  };

  const itemSections: FormSection<HomeSectionFormValues>[] = MEDIA_ITEMS_TYPES.has(type)
    ? items.map((_, index) => ({
        title: (
          <span className="flex w-full items-center justify-between">
            <span>Item {index + 1}</span>
            <span className="flex gap-1">
              <button
                type="button"
                aria-label={`Move item ${index + 1} up`}
                disabled={index === 0}
                onClick={() => {
                  const next = [...items];
                  [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                  form.setValue("payload.items", next, { shouldDirty: true });
                }}
                className="flex size-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Move item ${index + 1} down`}
                disabled={index === items.length - 1}
                onClick={() => {
                  const next = [...items];
                  [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
                  form.setValue("payload.items", next, { shouldDirty: true });
                }}
                className="flex size-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Remove item ${index + 1}`}
                onClick={() => form.setValue("payload.items", items.filter((_, i) => i !== index), { shouldDirty: true })}
                className="flex size-7 items-center justify-center rounded text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          </span>
        ),
        fields: [
          { type: FieldType.IMAGE_ASSET, name: `payload.items.${index}.image`, label: "Image", policy: bannerImagePolicy, colSpan: 2 },
          { type: FieldType.IMAGE_ASSET, name: `payload.items.${index}.mobileImage`, label: "Mobile image (optional)", policy: bannerImagePolicy, colSpan: 2 },
          { type: FieldType.LOCALIZED_INPUT, name: `payload.items.${index}.title`, label: "Title", colSpan: "full" },
          { type: FieldType.LOCALIZED_INPUT, name: `payload.items.${index}.subtitle`, label: "Subtitle", colSpan: "full" },
          { type: FieldType.INPUT, name: `payload.items.${index}.href`, label: "Link URL", colSpan: "full" },
        ],
      }))
    : [];

  const payloadFields: FormSection<HomeSectionFormValues>[] = [];
  if (type === "PRODUCT_RAIL") {
    const sourceFields: FormSection<HomeSectionFormValues>["fields"] =
      source === "PRODUCTS"
        ? [
            {
              type: FieldType.FEATURE_COMBOBOX,
              name: "payload.products",
              label: "Products",
              multiple: true,
              endpoint: productCrudEndpoints.get,
              optionLabel: (item) => pickLocalized((item as unknown as ProductEntity).name, "en"),
              optionValue: (item) => (item as unknown as ProductEntity)._id,
              query: { limit: 100 },
              colSpan: "full",
            },
          ]
        : [
            {
              type: FieldType.FEATURE_COMBOBOX,
              name: "payload.category",
              label: "Category",
              endpoint: categoryCrudEndpoints.get,
              optionLabel: (item) => pickLocalized((item as unknown as CategoryEntity).name, "en"),
              optionValue: (item) => (item as unknown as CategoryEntity)._id,
              query: { limit: 100 },
              colSpan: "full",
            },
          ];
    payloadFields.push({
      title: "Product rail",
      fields: [
        {
          type: FieldType.SELECT,
          name: "payload.source",
          label: "Source",
          options: [
            { label: "Category", value: "CATEGORY" },
            { label: "Specific products", value: "PRODUCTS" },
          ],
          rules: { required: "Required" },
        },
        { type: FieldType.INPUT, name: "payload.limit", label: "Limit", inputType: "number", placeholder: "Default" },
        ...sourceFields,
      ],
    });
  } else if (type === "SPOTLIGHT") {
    payloadFields.push({
      title: "Spotlight",
      fields: [
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "payload.product",
          label: "Product",
          endpoint: productCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as ProductEntity).name, "en"),
          optionValue: (item) => (item as unknown as ProductEntity)._id,
          query: { limit: 100 },
          colSpan: "full",
          rules: { required: "Required" },
        },
        { type: FieldType.INPUT, name: "payload.videoUrl", label: "Video URL", placeholder: "https://…" },
        { type: FieldType.INPUT, name: "payload.couponCode", label: "Coupon code" },
        { type: FieldType.DATE, name: "payload.endsAt", label: "Ends", includeTime: true },
      ],
    });
  } else if (type === "BRAND_CAROUSEL") {
    payloadFields.push({
      title: "Brand carousel",
      fields: [
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "payload.brands",
          label: "Brands",
          description: "Leave empty to show every active brand.",
          multiple: true,
          endpoint: brandCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as BrandEntity).name, "en"),
          optionValue: (item) => (item as unknown as BrandEntity)._id,
          query: { limit: 100 },
          colSpan: "full",
        },
      ],
    });
  } else if (LIMIT_TYPES.has(type)) {
    payloadFields.push({
      title: TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Options",
      fields: [{ type: FieldType.INPUT, name: "payload.limit", label: "Limit", inputType: "number", placeholder: "Default" }],
    });
  }

  const sections: FormSection<HomeSectionFormValues>[] = [baseSection, ...itemSections, ...payloadFields];

  const transformValues = (values: HomeSectionFormValues): HomeSectionFormValues => ({
    ...values,
    sortOrder: toNumber(values.sortOrder),
    payload: {
      ...values.payload,
      limit: toNumberOrUndefined(values.payload?.limit),
      category: values.payload?.category || null,
      product: values.payload?.product || null,
      endsAt: values.payload?.endsAt || null,
    },
  });

  const handleSuccess = (saved: HomeSectionEntity) => {
    toast.success(section ? "Section updated" : "Section created");
    void queryClient.invalidateQueries();
    router.push(`/admin/home-sections/${saved._id}`);
  };

  const addItem = () => form.setValue("payload.items", [...items, { title: EMPTY_LOCALIZED, subtitle: EMPTY_LOCALIZED, href: "" }], { shouldDirty: true });

  const children = MEDIA_ITEMS_TYPES.has(type) ? (
    <CustomButton type="button" variant="outline" leftIcon={Plus} className="self-start" onClick={addItem}>
      Add item
    </CustomButton>
  ) : undefined;

  if (section) {
    return (
      <CustomForm<HomeSectionFormValues, typeof homeSectionCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={homeSectionCrudEndpoints.update}
        submitParams={{ id: section._id }}
        transformValues={transformValues}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {children}
      </CustomForm>
    );
  }

  return (
    <CustomForm<HomeSectionFormValues, typeof homeSectionCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={homeSectionCrudEndpoints.create}
      transformValues={transformValues}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    >
      {children}
    </CustomForm>
  );
}
