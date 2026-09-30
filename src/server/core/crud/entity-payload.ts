import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import { validateDto } from "@kira-joo/backend-toolkit-core";
import type { ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import type { ClassConstructor } from "src/server/core/dto/transform";
import {
  assetProviderForFiles,
  destroyReplacedAssets,
  destroyUploadedAssets,
  parseRequestPayload,
  processAssetUploadFields,
  type AssetFieldConfig,
  type UploadedAssetRef,
} from "src/server/core/assets";

export type AssetFields = readonly AssetFieldConfig[] | ((files: Record<string, ParsedMultipartFile>) => AssetFieldConfig[]);

export interface ParsedEntityPayload<TDto> {
  dto: TDto;
  provider: AssetProvider | null;
  uploaded: UploadedAssetRef[];
  files: Record<string, ParsedMultipartFile>;
  payload: Record<string, unknown>;
  fields: AssetFieldConfig[];
}

/**
 * The upload-on-submit convention: the body is JSON or multipart (a `payload`
 * JSON part plus one part per file field). Files upload first, their assets are
 * merged into the payload, then the whole thing is validated. A validation
 * failure destroys what was just uploaded.
 */
export async function parseEntityPayload<TDto extends object>(
  request: NextRequest,
  dtoClass: ClassConstructor<TDto>,
  assetFields: AssetFields,
  folder: string
): Promise<ParsedEntityPayload<TDto>> {
  const { payload, files } = await parseRequestPayload(request);
  const fields = typeof assetFields === "function" ? assetFields(files) : [...assetFields];
  const provider = assetProviderForFiles(files, fields);
  const { uploaded } = await processAssetUploadFields({ files, payload, fields, provider, folder });

  try {
    const dto = (await validateDto(dtoClass, payload)) as TDto;
    return { dto, provider, uploaded, files, payload, fields };
  } catch (error) {
    await destroyUploadedAssets(provider, uploaded);
    throw error;
  }
}

/** Runs the write; on failure the just-uploaded files do not outlive it. */
export async function persistWithAssets<T>(parsed: ParsedEntityPayload<object>, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    await destroyUploadedAssets(parsed.provider, parsed.uploaded);
    throw error;
  }
}

/** After a successful update: removes stored images that were replaced or cleared. */
export async function cleanupReplacedAssets(parsed: ParsedEntityPayload<object>, previous: object): Promise<void> {
  await destroyReplacedAssets({
    provider: parsed.provider,
    fields: parsed.fields,
    files: parsed.files,
    payload: parsed.payload,
    previousDocument: previous as Record<string, unknown>,
  });
}
