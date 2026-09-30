"use client";

import { couponCrudEndpoints, type CouponEntity, type CouponFormValues } from "api/admin-coupons.endpoints";
import { CustomForm, FieldType, type FormSection } from "@kira-joo/frontend-toolkit-tailwind/forms";
import { InfoRow, PageSection, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toNumberOrUndefined } from "src/components/admin/form-number";

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toFormValues(coupon?: CouponEntity): CouponFormValues {
  if (!coupon) {
    return {
      code: "",
      description: EMPTY_LOCALIZED,
      type: "PERCENT",
      value: "",
      minSubtotal: "",
      maxDiscount: "",
      freeShipping: false,
      startsAt: "",
      endsAt: "",
      usageLimit: null,
      isActive: true,
    };
  }
  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal ?? "",
    maxDiscount: coupon.maxDiscount ?? "",
    freeShipping: coupon.freeShipping,
    startsAt: coupon.startsAt ?? "",
    endsAt: coupon.endsAt ?? "",
    usageLimit: coupon.usageLimit ?? null,
    isActive: coupon.isActive,
  };
}

function toBody(values: CouponFormValues): CouponFormValues {
  return {
    ...values,
    code: values.code.toUpperCase(),
    usageLimit: toNumberOrUndefined(values.usageLimit) ?? null,
  };
}

export interface CouponFormProps {
  coupon?: CouponEntity;
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<CouponFormValues>({ defaultValues: toFormValues(coupon) });

  const sections: FormSection<CouponFormValues>[] = [
    {
      title: "Coupon",
      fields: [
        { type: FieldType.INPUT, name: "code", label: "Code", rules: { required: "Required" }, colSpan: 2 },
        {
          type: FieldType.SELECT,
          name: "type",
          label: "Discount type",
          options: [
            { label: "Percent off", value: "PERCENT" },
            { label: "Fixed amount", value: "FIXED" },
          ],
          colSpan: 2,
        },
        { type: FieldType.INPUT, name: "value", label: "Value", description: "A percent (1–100) or a fixed amount.", rules: { required: "Required" } },
        { type: FieldType.INPUT, name: "minSubtotal", label: "Minimum subtotal", placeholder: "No minimum" },
        { type: FieldType.INPUT, name: "maxDiscount", label: "Maximum discount (percent only)", placeholder: "No cap" },
        { type: FieldType.INPUT, name: "usageLimit", label: "Usage limit", inputType: "number", placeholder: "Unlimited" },
        { type: FieldType.DATE, name: "startsAt", label: "Starts", includeTime: true },
        { type: FieldType.DATE, name: "endsAt", label: "Ends", includeTime: true },
        { type: FieldType.LOCALIZED_TEXTAREA, name: "description", label: "Description shown to customers", colSpan: "full", rows: 2 },
        { type: FieldType.SWITCH, name: "freeShipping", label: "Also grants free shipping" },
        { type: FieldType.SWITCH, name: "isActive", label: "Active" },
      ],
    },
  ];

  const handleSuccess = (saved: CouponEntity) => {
    toast.success(coupon ? "Coupon updated" : "Coupon created");
    void queryClient.invalidateQueries();
    router.push(`/admin/coupons/${saved._id}`);
  };

  const usage = coupon ? (
    <PageSection title="Usage">
      <InfoRow label="Redeemed" value={`${coupon.usedCount}${coupon.usageLimit ? ` of ${coupon.usageLimit}` : " (unlimited)"}`} />
    </PageSection>
  ) : null;

  if (coupon) {
    return (
      <CustomForm<CouponFormValues, typeof couponCrudEndpoints.update>
        form={form}
        mode="edit"
        sections={sections}
        submitEndpoint={couponCrudEndpoints.update}
        submitParams={{ id: coupon._id }}
        transformValues={toBody}
        onSuccess={handleSuccess}
        warnOnUnsavedChanges
      >
        {usage}
      </CustomForm>
    );
  }

  return (
    <CustomForm<CouponFormValues, typeof couponCrudEndpoints.create>
      form={form}
      mode="create"
      sections={sections}
      submitEndpoint={couponCrudEndpoints.create}
      transformValues={toBody}
      onSuccess={handleSuccess}
      warnOnUnsavedChanges
    />
  );
}
