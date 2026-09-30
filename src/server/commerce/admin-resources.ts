import { toMoney } from "@kira-joo/toolkit-common";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { couponRepository } from "src/server/core/repositories";
import { CouponDto, ListCouponsQueryDto } from "./dto/commerce.dto";

export const couponCrud = {
  repository: couponRepository,
  dto: CouponDto,
  listQuery: ListCouponsQueryDto,
  tags: [CacheTag.COUPONS, CacheTag.PRODUCTS],
  toEntity: (dto: CouponDto) => ({
    ...dto,
    code: dto.code.toUpperCase(),
    value: toMoney(dto.value),
    minSubtotal: dto.minSubtotal ? toMoney(dto.minSubtotal) : null,
    maxDiscount: dto.maxDiscount ? toMoney(dto.maxDiscount) : null,
    startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
    endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
  }),
};
