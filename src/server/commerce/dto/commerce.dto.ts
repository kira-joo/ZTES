import { BaseFindQueryDto, ToBoolean, Trim } from "@kira-joo/backend-toolkit-core";
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { CouponType, Locale, OrderStatus, PaymentMethod } from "src/common/enums";
import { LocalizedTextDto, MONEY_PATTERN, ToMoneyString } from "src/server/core/dto/common.dto";
import { Type } from "src/server/core/dto/transform";

/**
 * Storefront DTO messages are stable keys (`required`, `invalidPhone` …), not
 * prose: the storefront renders them through next-intl in the customer's
 * language. The admin is English-only and uses plain messages.
 */
const SAUDI_MOBILE = /^(?:\+?966|00966|0)?5\d{8}$/;

// ─── Storefront: cart ───────────────────────────────────────────────────────

export class AddCartLineDto {
  @IsMongoId({ message: "invalid" }) productId!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsMongoId({ each: true, message: "invalid" }) optionValueIds?: string[];
  @IsInt({ message: "invalid" }) @Min(1, { message: "invalid" }) @Max(99, { message: "tooMany" }) quantity!: number;
}

export class UpdateCartLineDto {
  @IsInt({ message: "invalid" }) @Min(1, { message: "invalid" }) @Max(99, { message: "tooMany" }) quantity!: number;
}

export class CartLineParamsDto {
  @IsMongoId() lineId!: string;
}

export class ApplyCouponDto {
  @Trim() @IsString() @MinLength(1, { message: "required" }) @MaxLength(40, { message: "tooLong" }) code!: string;
}

export class GiftDto {
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(80, { message: "tooLong" }) senderName!: string;
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(80, { message: "tooLong" }) recipientName!: string;
  @Trim() @Matches(SAUDI_MOBILE, { message: "invalidPhone" }) recipientPhone!: string;
  @IsOptional() @IsString() @MaxLength(300, { message: "tooLong" }) message?: string;
  @IsOptional() @ValidateIf((_, value) => value !== null && value !== "") @IsDateString({}, { message: "invalid" }) deliverOn?: string | null;
}

export class SetGiftDto {
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => GiftDto) gift!: GiftDto | null;
}

// ─── Storefront: checkout ───────────────────────────────────────────────────

export class CheckoutContactDto {
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(60, { message: "tooLong" }) firstName!: string;
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(60, { message: "tooLong" }) lastName!: string;
  @Trim() @Matches(SAUDI_MOBILE, { message: "invalidPhone" }) phone!: string;
  @Trim() @IsEmail({}, { message: "invalidEmail" }) @MaxLength(160, { message: "tooLong" }) email!: string;
}

export class CheckoutAddressDto {
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(80, { message: "tooLong" }) district!: string;
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(160, { message: "tooLong" }) street!: string;
  @IsOptional() @IsString() @MaxLength(80, { message: "tooLong" }) building?: string;
  @IsOptional() @IsString() @MaxLength(300, { message: "tooLong" }) notes?: string;
  @IsOptional() @ValidateIf((_, value) => value !== "") @Matches(/^https:\/\/\S+$/, { message: "invalidUrl" }) @MaxLength(500) mapUrl?: string;
}

export class PlaceOrderDto {
  @ValidateNested() @Type(() => CheckoutContactDto) contact!: CheckoutContactDto;
  @ValidateNested() @Type(() => CheckoutAddressDto) address!: CheckoutAddressDto;
  @IsOptional() @IsString() @MaxLength(500, { message: "tooLong" }) customerNotes?: string;
  @IsBoolean({ message: "safeUseRequired" }) @Equals(true, { message: "safeUseRequired" }) safeUseAccepted!: boolean;
  /** Cash on delivery is the only method; anything else is rejected here. */
  @IsIn([PaymentMethod.CASH_ON_DELIVERY], { message: "invalid" }) paymentMethod!: PaymentMethod;
  @IsEnum(Locale, { message: "invalid" }) locale!: Locale;
}

// ─── Storefront: buyer review, newsletter ───────────────────────────────────

export class SubmitReviewDto {
  @IsMongoId({ message: "invalid" }) productId!: string;
  @IsInt({ message: "required" }) @Min(1, { message: "required" }) @Max(5, { message: "invalid" }) rating!: number;
  @Trim() @IsString() @MinLength(2, { message: "required" }) @MaxLength(80, { message: "tooLong" }) authorName!: string;
  @IsOptional() @IsString() @MaxLength(2000, { message: "tooLong" }) body?: string;
}

export class NewsletterDto {
  @Trim() @IsEmail({}, { message: "invalidEmail" }) @MaxLength(160, { message: "tooLong" }) email!: string;
  @IsOptional() @IsEnum(Locale) locale?: Locale;
}

// ─── Admin: coupons ─────────────────────────────────────────────────────────

export class CouponDto {
  @Trim() @IsString() @Matches(/^[A-Za-z0-9_-]{2,40}$/, { message: "Letters, numbers, - and _ only (2–40)." }) code!: string;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) description?: LocalizedTextDto;
  @IsEnum(CouponType) type!: CouponType;
  @ToMoneyString() @Matches(MONEY_PATTERN, { message: "An amount like 10 or 10.50." }) value!: string;
  @IsOptional() @ValidateIf((_, value) => value !== null && value !== "") @ToMoneyString() @Matches(MONEY_PATTERN) minSubtotal?: string | null;
  @IsOptional() @ValidateIf((_, value) => value !== null && value !== "") @ToMoneyString() @Matches(MONEY_PATTERN) maxDiscount?: string | null;
  @IsOptional() @IsBoolean() freeShipping?: boolean;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsDateString() startsAt?: string | null;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsDateString() endsAt?: string | null;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsInt() @Min(1) usageLimit?: number | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ListCouponsQueryDto extends BaseFindQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean() isActive?: boolean;
}

// ─── Admin: orders, customers ───────────────────────────────────────────────

export class ListOrdersQueryDto extends BaseFindQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @ToBoolean() @IsBoolean() contactMismatch?: boolean;
  @IsOptional() @IsMongoId() customer?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class TransitionOrderDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class ListCustomersQueryDto extends BaseFindQueryDto {}
