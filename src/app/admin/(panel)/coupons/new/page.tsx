"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { CouponForm } from "src/features/admin/coupons/coupon-form";

export default function NewCouponPage() {
  return (
    <PageShell title="Add coupon" backRoute={{ path: "/admin/coupons", label: "Back to coupons" }}>
      <CouponForm />
    </PageShell>
  );
}
