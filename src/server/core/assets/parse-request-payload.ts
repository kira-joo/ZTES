import { parseMultipartFormData, type ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";

export interface RequestPayload {
  payload: Record<string, unknown>;
  files: Record<string, ParsedMultipartFile>;
}

/**
 * Reads a route's body as either JSON or multipart, whichever it was sent as.
 *
 * ## Why an asset-bearing route cannot simply demand multipart
 *
 * `CustomForm` switches to multipart when a declared field is an
 * `IMAGE_ASSET` — but it only ever knows about the sections it is currently
 * RENDERING. The storefront-content screen passes one tab's sections at a
 * time, and only the Identity tab holds images, so the Brand, Contact, Locale
 * and SEO tabs submit plain JSON to the same endpoint.
 *
 * A multipart-only route therefore turns four working tabs into failures the
 * moment the fifth one learns to upload. Accepting both is not leniency: the
 * two encodings are the same request, and which one arrives is decided by a
 * detail of the screen rather than by the caller's intent.
 *
 * A JSON request carries no files, so every asset field is simply absent —
 * which the upload processor already reads as "unchanged", the correct
 * meaning for a tab that has no image fields on it.
 */
export async function parseRequestPayload(request: NextRequest): Promise<RequestPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const { fields, files } = await parseMultipartFormData(request);
    return { payload: JSON.parse(fields.payload ?? "{}") as Record<string, unknown>, files };
  }

  return { payload: (await request.json()) as Record<string, unknown>, files: {} };
}
