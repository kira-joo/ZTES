"use client";

import { couponCrudEndpoints } from "api/admin-coupons.endpoints";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { use } from "react";
import { CouponForm } from "src/features/admin/coupons/coupon-form";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useRequesterQuery({ endpoint: couponCrudEndpoints.getDetails, options: { params: { id } } });

  return (
    <PageShell title={query.data ? query.data.code : "Edit coupon"} backRoute={{ path: "/admin/coupons", label: "Back to coupons" }}>
      <QueryState query={query} entityName="Coupon" backRoute={{ path: "/admin/coupons", label: "Back to coupons" }}>
        {(coupon) => <CouponForm coupon={coupon} />}
      </QueryState>
    </PageShell>
  );
}
