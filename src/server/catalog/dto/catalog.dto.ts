import { BaseFindQueryDto, ToBoolean } from "@kira-joo/backend-toolkit-core";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { BadgeTone, ProductOptionType } from "src/common/enums";
import {
  ImageAssetDto,
  LocalizedLongTextDto,
  LocalizedSlugDto,
  LocalizedTextDto,
  MONEY_PATTERN,
  SeoDto,
  ToMoneyString,
} from "src/server/core/dto/common.dto";
import { Type } from "src/server/core/dto/transform";

const MONEY_MESSAGE = { message: "An amount like 89 or 89.50." };

// ─── Categories ─────────────────────────────────────────────────────────────

export class CategoryDto {
  @ValidateNested() @Type(() => LocalizedTextDto) name!: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedSlugDto) slug!: LocalizedSlugDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedLongTextDto) description?: LocalizedLongTextDto;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsMongoId() parent?: string | null;
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => ImageAssetDto) image?: ImageAssetDto | null;
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => ImageAssetDto) icon?: ImageAssetDto | null;
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => ImageAssetDto) banner?: ImageAssetDto | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() showInMenu?: boolean;
  @IsOptional() @ValidateNested() @Type(() => SeoDto) seo?: SeoDto;
}

export class ListCategoriesQueryDto extends BaseFindQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsMongoId() parent?: string;
}

class ReorderEntryDto {
  @IsMongoId() id!: string;
  @IsInt() @Min(0) sortOrder!: number;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsMongoId() parent?: string | null;
}

export class ReorderDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ReorderEntryDto)
  items!: ReorderEntryDto[];
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export class BrandDto {
  @ValidateNested() @Type(() => LocalizedTextDto) name!: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedSlugDto) slug!: LocalizedSlugDto;
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => ImageAssetDto) logo?: ImageAssetDto | null;
  @IsOptional() @ValidateNested() @Type(() => LocalizedLongTextDto) description?: LocalizedLongTextDto;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @ValidateNested() @Type(() => SeoDto) seo?: SeoDto;
}

export class ListBrandsQueryDto extends BaseFindQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean() isActive?: boolean;
}

// ─── Products ───────────────────────────────────────────────────────────────

class OptionValueDto {
  @IsOptional() @IsMongoId() _id?: string;
  @ValidateNested() @Type(() => LocalizedTextDto) label!: LocalizedTextDto;
  @IsOptional() @ToMoneyString() @Matches(MONEY_PATTERN, MONEY_MESSAGE) priceDelta?: string;
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => ImageAssetDto) image?: ImageAssetDto | null;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

class OptionGroupDto {
  @IsOptional() @IsMongoId() _id?: string;
  @ValidateNested() @Type(() => LocalizedTextDto) name!: LocalizedTextDto;
  @IsEnum(ProductOptionType) type!: ProductOptionType;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => OptionValueDto) values!: OptionValueDto[];
}

class BadgeDto {
  @ValidateNested() @Type(() => LocalizedTextDto) label!: LocalizedTextDto;
  @IsEnum(BadgeTone) tone!: BadgeTone;
}

class QuantityTierDto {
  @IsInt() @Min(2) @Max(999) minQuantity!: number;
  @IsInt() @Min(1) @Max(90) percent!: number;
}

export class ProductDto {
  @ValidateNested() @Type(() => LocalizedTextDto) name!: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedSlugDto) slug!: LocalizedSlugDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedLongTextDto) description?: LocalizedLongTextDto;
  @IsOptional() @IsString() @MaxLength(80) sku?: string;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsMongoId() brand?: string | null;
  @IsArray() @ArrayMaxSize(30) @IsMongoId({ each: true }) categories!: string[];
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsMongoId() primaryCategory?: string | null;
  @ToMoneyString() @Matches(MONEY_PATTERN, MONEY_MESSAGE) price!: string;
  @IsOptional() @ValidateIf((_, value) => value !== null && value !== "") @ToMoneyString() @Matches(MONEY_PATTERN, MONEY_MESSAGE) compareAtPrice?: string | null;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsDateString() saleEndsAt?: string | null;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsBoolean() trackStock?: boolean;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) weight?: LocalizedTextDto;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => OptionGroupDto) options?: OptionGroupDto[];
  @IsOptional() @ValidateIf((_, value) => value !== null) @ValidateNested() @Type(() => BadgeDto) badge?: BadgeDto | null;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => QuantityTierDto) quantityTiers?: QuantityTierDto[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @ValidateNested() @Type(() => SeoDto) seo?: SeoDto;
}

export class ListProductsQueryDto extends BaseFindQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean() isActive?: boolean;
  @IsOptional() @ToBoolean() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsMongoId() brand?: string;
  @IsOptional() @IsMongoId() categories?: string;
  /** `low` = tracked stock ≤ 5, `out` = tracked stock 0. */
  @IsOptional() @IsEnum(["low", "out"]) stockLevel?: "low" | "out";
}

export class ProductStatusDto {
  @IsBoolean() isActive!: boolean;
}

export class ImageOrderDto {
  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) publicIds!: string[];
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export class ListReviewsQueryDto extends BaseFindQueryDto {
  @IsOptional() @IsMongoId() product?: string;
  @IsOptional() @ToBoolean() @IsBoolean() isPublished?: boolean;
}

export class ReviewUpdateDto {
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsString() @MaxLength(80) authorName?: string;
  @IsOptional() @IsString() @MaxLength(4000) body?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
}
