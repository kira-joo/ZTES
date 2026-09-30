"use client";

import { categoryCrudEndpoints, type CategoryEntity } from "api/admin-categories.endpoints";
import { productCrudEndpoints, type ProductEntity } from "api/admin-products.endpoints";
import { settingsEndpoint, updateSettingsEndpoint, type StoreSettingsEntity, type StoreSettingsFormValues } from "api/admin-settings.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, FieldType, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { PageShell, QueryState, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Tabs } from "@kira-joo/frontend-toolkit-tailwind/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { FormLocalizedRichText } from "src/components/admin/form-localized-rich-text";
import { toNumber } from "src/components/admin/form-number";
import { pickLocalized } from "src/lib/localized";
import { contentImagePolicy, logoImagePolicy } from "src/server/core/assets/upload-policies";
import { AnnouncementsEditor } from "./announcements-editor";
import { BranchesEditor } from "./branches-editor";

const EMPTY_LOCALIZED = { ar: "", en: "" };
const FAVICON_POLICY = { ...logoImagePolicy, minWidth: 16, minHeight: 16 };

const TABS = [
  { id: "store", label: "Store" },
  { id: "contact", label: "Contact & social" },
  { id: "legal", label: "Legal" },
  { id: "delivery", label: "Delivery" },
  { id: "announcements", label: "Announcements" },
  { id: "safe-use", label: "Safe use" },
  { id: "branches", label: "Branches" },
  { id: "search", label: "Search suggestions" },
  { id: "popup", label: "Popup" },
  { id: "seo", label: "SEO" },
  { id: "app-links", label: "App links" },
];

function toFormValues(settings: StoreSettingsEntity): StoreSettingsFormValues {
  return {
    storeName: settings.storeName,
    tagline: settings.tagline ?? EMPTY_LOCALIZED,
    logo: settings.logo ?? null,
    favicon: settings.favicon ?? null,
    contact: settings.contact ?? {},
    social: settings.social ?? {},
    legal: settings.legal ?? {},
    appLinks: settings.appLinks ?? {},
    announcements: settings.announcements ?? [],
    footerDescription: settings.footerDescription ?? EMPTY_LOCALIZED,
    delivery: settings.delivery,
    vatRate: settings.vatRate,
    safeUseTitle: settings.safeUseTitle ?? EMPTY_LOCALIZED,
    safeUseText: settings.safeUseText,
    branches: settings.branches ?? [],
    searchCategories: settings.searchCategories ?? [],
    searchProducts: settings.searchProducts ?? [],
    popup: settings.popup ?? { isActive: false, title: EMPTY_LOCALIZED, body: EMPTY_LOCALIZED, ctaLabel: EMPTY_LOCALIZED, ctaHref: "" },
    seo: settings.seo ?? { title: EMPTY_LOCALIZED, description: EMPTY_LOCALIZED },
  };
}

function SettingsForm({ settings }: { settings: StoreSettingsEntity }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("store");
  const form: UseFormReturn<StoreSettingsFormValues> = useForm<StoreSettingsFormValues>({ defaultValues: toFormValues(settings) });
  const hidden = (tab: string) => activeTab !== tab;
  const popupActive = useWatch({ control: form.control, name: "popup.isActive" });

  const sections: FormSection<StoreSettingsFormValues>[] = [
    {
      title: "Store identity",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "storeName", label: "Store name", rules: { required: "Required" }, hidden: hidden("store"), colSpan: "full" },
        { type: FieldType.LOCALIZED_INPUT, name: "tagline", label: "Tagline", hidden: hidden("store"), colSpan: "full" },
        { type: FieldType.IMAGE_ASSET, name: "logo", label: "Logo", policy: logoImagePolicy, hidden: hidden("store") },
        { type: FieldType.IMAGE_ASSET, name: "favicon", label: "Favicon", policy: FAVICON_POLICY, hidden: hidden("store") },
      ],
    },
    {
      title: "Contact",
      fields: [
        { type: FieldType.INPUT, name: "contact.phone", label: "Phone", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "contact.whatsapp", label: "WhatsApp", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "contact.email", label: "Email", hidden: hidden("contact") },
        { type: FieldType.LOCALIZED_INPUT, name: "contact.address", label: "Address", hidden: hidden("contact"), colSpan: "full" },
      ],
    },
    {
      title: "Social",
      fields: [
        { type: FieldType.INPUT, name: "social.instagram", label: "Instagram", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "social.x", label: "X", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "social.tiktok", label: "TikTok", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "social.facebook", label: "Facebook", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "social.youtube", label: "YouTube", hidden: hidden("contact") },
        { type: FieldType.INPUT, name: "social.snapchat", label: "Snapchat", hidden: hidden("contact") },
      ],
    },
    {
      title: "Legal",
      fields: [
        { type: FieldType.INPUT, name: "legal.vatNumber", label: "VAT number", hidden: hidden("legal") },
        { type: FieldType.INPUT, name: "legal.crNumber", label: "CR number", hidden: hidden("legal") },
        { type: FieldType.IMAGE_ASSET, name: "legal.vatCertificate", label: "VAT certificate", policy: contentImagePolicy, hidden: hidden("legal") },
      ],
    },
    {
      title: "Delivery",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "delivery.city", label: "City", rules: { required: "Required" }, hidden: hidden("delivery") },
        { type: FieldType.INPUT, name: "delivery.fee", label: "Delivery fee", rules: { required: "Required" }, hidden: hidden("delivery") },
        { type: FieldType.INPUT, name: "delivery.freeShippingThreshold", label: "Free-shipping threshold", placeholder: "Never free", hidden: hidden("delivery") },
        { type: FieldType.LOCALIZED_INPUT, name: "delivery.estimate", label: "Delivery estimate", hidden: hidden("delivery"), colSpan: "full" },
        { type: FieldType.INPUT, name: "vatRate", label: "VAT rate (%)", inputType: "number", rules: { required: "Required" }, hidden: hidden("delivery") },
      ],
    },
    {
      title: "Safe use",
      fields: [{ type: FieldType.LOCALIZED_INPUT, name: "safeUseTitle", label: "Title", hidden: hidden("safe-use"), colSpan: "full" }],
    },
    {
      title: "Search suggestions",
      description: "Shown before the customer types anything into search.",
      fields: [
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "searchCategories",
          label: "Categories",
          multiple: true,
          endpoint: categoryCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as CategoryEntity).name, "en"),
          optionValue: (item) => (item as unknown as CategoryEntity)._id,
          query: { limit: 100 },
          hidden: hidden("search"),
          colSpan: "full",
        },
        {
          type: FieldType.FEATURE_COMBOBOX,
          name: "searchProducts",
          label: "Products",
          multiple: true,
          endpoint: productCrudEndpoints.get,
          optionLabel: (item) => pickLocalized((item as unknown as ProductEntity).name, "en"),
          optionValue: (item) => (item as unknown as ProductEntity)._id,
          query: { limit: 100 },
          hidden: hidden("search"),
          colSpan: "full",
        },
      ],
    },
    {
      title: "Promotional popup",
      fields: [
        { type: FieldType.SWITCH, name: "popup.isActive", label: "Active", hidden: hidden("popup") },
        { type: FieldType.LOCALIZED_INPUT, name: "popup.title", label: "Title", hidden: hidden("popup") || !popupActive, colSpan: "full" },
        { type: FieldType.IMAGE_ASSET, name: "popup.image", label: "Image", policy: contentImagePolicy, hidden: hidden("popup") || !popupActive },
        { type: FieldType.LOCALIZED_INPUT, name: "popup.ctaLabel", label: "Button label", hidden: hidden("popup") || !popupActive },
        { type: FieldType.INPUT, name: "popup.ctaHref", label: "Button link", hidden: hidden("popup") || !popupActive },
      ],
    },
    {
      title: "SEO defaults",
      fields: [
        { type: FieldType.LOCALIZED_INPUT, name: "seo.title", label: "Meta title", hidden: hidden("seo"), colSpan: "full" },
        { type: FieldType.LOCALIZED_TEXTAREA, name: "seo.description", label: "Meta description", rows: 3, hidden: hidden("seo"), colSpan: "full" },
      ],
    },
    {
      title: "App links",
      fields: [
        { type: FieldType.INPUT, name: "appLinks.appStore", label: "App Store URL", hidden: hidden("app-links") },
        { type: FieldType.INPUT, name: "appLinks.googlePlay", label: "Google Play URL", hidden: hidden("app-links") },
      ],
    },
  ];

  const transformValues = (values: StoreSettingsFormValues): StoreSettingsFormValues => ({
    ...values,
    vatRate: toNumber(values.vatRate),
    delivery: { ...values.delivery, freeShippingThreshold: values.delivery.freeShippingThreshold || null },
    footerDescription: form.getValues("footerDescription"),
    safeUseText: form.getValues("safeUseText"),
    popup: { ...values.popup, body: form.getValues("popup.body") },
    searchCategories: values.searchCategories ?? [],
    searchProducts: values.searchProducts ?? [],
    announcements: (form.getValues("announcements") ?? []).filter((a) => a.ar || a.en),
    branches: form.getValues("branches") ?? [],
    seo: { title: values.seo?.title ?? EMPTY_LOCALIZED, description: values.seo?.description ?? EMPTY_LOCALIZED },
  });

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={TABS.map((t) => ({ id: t.id, label: t.label }))} value={activeTab} onChange={setActiveTab} />

      <CustomForm<StoreSettingsFormValues, typeof updateSettingsEndpoint>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={updateSettingsEndpoint}
        transformValues={transformValues}
        onSuccess={() => {
          toast.success("Settings saved");
          void queryClient.invalidateQueries();
        }}
        warnOnUnsavedChanges
      >
        {/*
          Every block below stays MOUNTED regardless of the active tab —
          only its visibility toggles via `hidden`. RHF unregisters (and
          clears) a Controller's value on unmount by default, so a
          conditionally-*rendered* rich-text/array editor would silently
          lose its content the moment the tab that held it lost focus. This
          mirrors exactly what the declarative fields' own `hidden` prop
          does (see the toolkit's `FormFieldBase.hidden` doc).
        */}
        <div className={hidden("store") ? "hidden" : undefined}>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Footer description</p>
          <FormLocalizedRichText control={form.control} name="footerDescription" />
        </div>
        <div className={hidden("safe-use") ? "hidden" : undefined}>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Safe-use text</p>
          <FormLocalizedRichText control={form.control} name="safeUseText" />
        </div>
        <div className={hidden("announcements") ? "hidden" : undefined}>
          <AnnouncementsEditor control={form.control} />
        </div>
        <div className={hidden("branches") ? "hidden" : undefined}>
          <BranchesEditor control={form.control} />
        </div>
        <div className={hidden("popup") || !popupActive ? "hidden" : undefined}>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Popup body</p>
          <FormLocalizedRichText control={form.control} name="popup.body" />
        </div>
      </CustomForm>
    </div>
  );
}

export function SettingsView() {
  const query = useRequesterQuery({ endpoint: settingsEndpoint });

  return (
    <PageShell title="Settings" description="Store-wide configuration. Saving touches every page.">
      <QueryState query={query} entityName="Settings">
        {(settings) => <SettingsForm settings={settings} />}
      </QueryState>
    </PageShell>
  );
}
