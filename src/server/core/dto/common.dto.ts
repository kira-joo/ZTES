import { ImageAssetDto, Trim } from "@kira-joo/backend-toolkit-core";
import { IsOptional, IsString, Matches, MaxLength, ValidateNested } from "class-validator";
import { Transform, Type } from "./transform";

/** Money arrives as a string (never a float) and is converted to Decimal on the server. */
export const MONEY_PATTERN = /^\d{1,9}(\.\d{1,2})?$/;

/** Accepts a number too — acceptable as an input — but validates and stores the exact string. */
export const ToMoneyString = () =>
  Transform(({ value }) => (typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : value));

export class LocalizedTextDto {
  @Trim() @IsString() @MaxLength(500) ar!: string;
  @Trim() @IsString() @MaxLength(500) en!: string;
}

/** Long localized text (rich HTML, answers). Sanitised by the service, not here. */
export class LocalizedLongTextDto {
  @IsString() @MaxLength(100_000) ar!: string;
  @IsString() @MaxLength(100_000) en!: string;
}

export class LocalizedSlugDto {
  @Trim()
  @IsString()
  @MaxLength(160)
  @Matches(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, { message: "A slug is letters, numbers and single hyphens." })
  ar!: string;

  @Trim()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "An English slug is lowercase letters, numbers and single hyphens." })
  en!: string;
}

export class SeoDto {
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) title?: LocalizedTextDto;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) description?: LocalizedTextDto;
}

export { ImageAssetDto };
