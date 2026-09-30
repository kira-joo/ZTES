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
import { HomeSectionType, ProductRailSource } from "src/common/enums";
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

const nullableImage = () => [IsOptional(), ValidateIf((_: unknown, value: unknown) => value !== null), ValidateNested(), Type(() => ImageAssetDto)];
function NullableImage(): PropertyDecorator {
  return (target, key) => nullableImage().forEach((decorator) => (decorator as PropertyDecorator)(target, key));
}

// ─── Settings ───────────────────────────────────────────────────────────────

class ContactDto {
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(40) whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) address?: LocalizedTextDto;
}

class SocialDto {
  @IsOptional() @IsString() @MaxLength(300) instagram?: string;
  @IsOptional() @IsString() @MaxLength(300) x?: string;
  @IsOptional() @IsString() @MaxLength(300) tiktok?: string;
  @IsOptional() @IsString() @MaxLength(300) facebook?: string;
  @IsOptional() @IsString() @MaxLength(300) youtube?: string;
  @IsOptional() @IsString() @MaxLength(300) snapchat?: string;
}

class LegalDto {
  @IsOptional() @IsString() @MaxLength(40) vatNumber?: string;
  @IsOptional() @IsString() @MaxLength(40) crNumber?: string;
  @NullableImage() vatCertificate?: ImageAssetDto | null;
}

class AppLinksDto {
  @IsOptional() @IsString() @MaxLength(300) appStore?: string;
  @IsOptional() @IsString() @MaxLength(300) googlePlay?: string;
}

class DeliveryDto {
  @ValidateNested() @Type(() => LocalizedTextDto) city!: LocalizedTextDto;
  @ToMoneyString() @Matches(MONEY_PATTERN, { message: "An amount like 9 or 9.50." }) fee!: string;
  @IsOptional() @ValidateIf((_, value) => value !== null && value !== "") @ToMoneyString() @Matches(MONEY_PATTERN) freeShippingThreshold?: string | null;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) estimate?: LocalizedTextDto;
}

class BranchDto {
  @IsOptional() @IsMongoId() _id?: string;
  @ValidateNested() @Type(() => LocalizedTextDto) name!: LocalizedTextDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) address?: LocalizedTextDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) hours?: LocalizedTextDto;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(1000) mapUrl?: string;
  @IsOptional() @IsString() @MaxLength(2000) mapEmbedUrl?: string;
}

class PopupDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) title?: LocalizedTextDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedLongTextDto) body?: LocalizedLongTextDto;
  @NullableImage() image?: ImageAssetDto | null;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) ctaLabel?: LocalizedTextDto;
  @IsOptional() @IsString() @MaxLength(500) ctaHref?: string;
}

export class StoreSettingsDto {
  @ValidateNested() @Type(() => LocalizedTextDto) storeName!: LocalizedTextDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) tagline?: LocalizedTextDto;
  @NullableImage() logo?: ImageAssetDto | null;
  @NullableImage() favicon?: ImageAssetDto | null;
  @IsOptional() @ValidateNested() @Type(() => ContactDto) contact?: ContactDto;
  @IsOptional() @ValidateNested() @Type(() => SocialDto) social?: SocialDto;
  @IsOptional() @ValidateNested() @Type(() => LegalDto) legal?: LegalDto;
  @IsOptional() @ValidateNested() @Type(() => AppLinksDto) appLinks?: AppLinksDto;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => LocalizedTextDto) announcements?: LocalizedTextDto[];
  @IsOptional() @ValidateNested() @Type(() => LocalizedLongTextDto) footerDescription?: LocalizedLongTextDto;
  @ValidateNested() @Type(() => DeliveryDto) delivery!: DeliveryDto;
  @IsInt() @Min(0) @Max(100) vatRate!: number;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) safeUseTitle?: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedLongTextDto) safeUseText!: LocalizedLongTextDto;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => BranchDto) branches?: BranchDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsMongoId({ each: true }) searchCategories?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsMongoId({ each: true }) searchProducts?: string[];
  @IsOptional() @ValidateNested() @Type(() => PopupDto) popup?: PopupDto;
  @IsOptional() @ValidateNested() @Type(() => SeoDto) seo?: SeoDto;
}

// ─── Home sections ──────────────────────────────────────────────────────────

class HomeMediaItemDto {
  @IsOptional() @IsString() _id?: string;
  @NullableImage() image?: ImageAssetDto | null;
  @NullableImage() mobileImage?: ImageAssetDto | null;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) title?: LocalizedTextDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) subtitle?: LocalizedTextDto;
  @IsOptional() @IsString() @MaxLength(1000) href?: string;
}

class HomePayloadDto {
  @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => HomeMediaItemDto) items?: HomeMediaItemDto[];
  @IsOptional() @IsEnum(ProductRailSource) source?: ProductRailSource;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsMongoId() category?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(40) @IsMongoId({ each: true }) products?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(40) limit?: number;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsMongoId() product?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) videoUrl?: string;
  @IsOptional() @IsString() @MaxLength(40) couponCode?: string;
  @IsOptional() @ValidateIf((_, value) => value !== null) @IsDateString() endsAt?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(60) @IsMongoId({ each: true }) brands?: string[];
}

export class HomeSectionDto {
  @IsEnum(HomeSectionType) type!: HomeSectionType;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) title?: LocalizedTextDto;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @ValidateNested() @Type(() => HomePayloadDto) payload!: HomePayloadDto;
}

export class ListHomeSectionsQueryDto extends BaseFindQueryDto {
  @IsOptional() @IsEnum(HomeSectionType) type?: HomeSectionType;
}

// ─── Pages, posts ───────────────────────────────────────────────────────────

export class PageDto {
  @ValidateNested() @Type(() => LocalizedTextDto) title!: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedSlugDto) slug!: LocalizedSlugDto;
  @ValidateNested() @Type(() => LocalizedLongTextDto) body!: LocalizedLongTextDto;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() showInFooter?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @ValidateNested() @Type(() => SeoDto) seo?: SeoDto;
}

export class PostDto {
  @ValidateNested() @Type(() => LocalizedTextDto) title!: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedSlugDto) slug!: LocalizedSlugDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) excerpt?: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedLongTextDto) body!: LocalizedLongTextDto;
  @NullableImage() cover?: ImageAssetDto | null;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsDateString() publishedAt?: string;
  @IsOptional() @ValidateNested() @Type(() => SeoDto) seo?: SeoDto;
}

export class ListContentQueryDto extends BaseFindQueryDto {
  @IsOptional() @ToBoolean() @IsBoolean() isActive?: boolean;
  @IsOptional() @ToBoolean() @IsBoolean() isPublished?: boolean;
}

// ─── FAQs, testimonials ─────────────────────────────────────────────────────

export class FaqDto {
  @ValidateNested() @Type(() => LocalizedTextDto) question!: LocalizedTextDto;
  @ValidateNested() @Type(() => LocalizedLongTextDto) answer!: LocalizedLongTextDto;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class TestimonialDto {
  @IsString() @MaxLength(80) authorName!: string;
  @ValidateNested() @Type(() => LocalizedLongTextDto) body!: LocalizedLongTextDto;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @NullableImage() avatar?: ImageAssetDto | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
