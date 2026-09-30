import type { ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import mongoose from "mongoose";
import { bannerImagePolicy, contentImagePolicy, type AssetFieldConfig } from "src/server/core/assets";
import { sanitizeLocalizedRichText, sanitizeRichText } from "src/server/core/html/sanitize-html";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import {
  faqRepository,
  homeSectionRepository,
  pageRepository,
  postRepository,
  testimonialRepository,
} from "src/server/core/repositories";
import {
  FaqDto,
  HomeSectionDto,
  ListContentQueryDto,
  ListHomeSectionsQueryDto,
  PageDto,
  PostDto,
  TestimonialDto,
} from "./dto/content.dto";

/** Home-section item images arrive as `payload.items.N.image` / `.mobileImage` file parts. */
const HOME_ITEM_FILE = /^payload\.items\.\d+\.(image|mobileImage)$/;

export function homeSectionAssetFields(files: Record<string, ParsedMultipartFile>): AssetFieldConfig[] {
  return Object.keys(files)
    .filter((name) => HOME_ITEM_FILE.test(name))
    .map((name) => ({ name, policy: bannerImagePolicy }));
}

export const homeSectionCrud = {
  repository: homeSectionRepository,
  dto: HomeSectionDto,
  listQuery: ListHomeSectionsQueryDto,
  tags: [CacheTag.HOME],
  assetFields: homeSectionAssetFields,
  assetFolder: "ztes/home",
  toEntity: (dto: HomeSectionDto) => ({
    ...dto,
    payload: {
      ...dto.payload,
      items: (dto.payload.items ?? []).map((item) => ({ ...item, _id: item._id ?? new mongoose.Types.ObjectId().toHexString() })),
    },
  }),
};

export const pageCrud = {
  repository: pageRepository,
  dto: PageDto,
  listQuery: ListContentQueryDto,
  tags: [CacheTag.PAGES],
  toEntity: (dto: PageDto) => ({ ...dto, body: sanitizeLocalizedRichText(dto.body) }),
};

export const postCrud = {
  repository: postRepository,
  dto: PostDto,
  listQuery: ListContentQueryDto,
  tags: [CacheTag.POSTS, CacheTag.HOME],
  assetFields: [{ name: "cover", policy: contentImagePolicy }],
  assetFolder: "ztes/posts",
  toEntity: (dto: PostDto) => ({
    ...dto,
    body: sanitizeLocalizedRichText(dto.body),
    ...(dto.publishedAt ? { publishedAt: new Date(dto.publishedAt) } : {}),
  }),
};

export const faqCrud = {
  repository: faqRepository,
  dto: FaqDto,
  listQuery: ListContentQueryDto,
  tags: [CacheTag.FAQS, CacheTag.HOME],
  toEntity: (dto: FaqDto) => ({ ...dto, answer: { ar: sanitizeRichText(dto.answer.ar), en: sanitizeRichText(dto.answer.en) } }),
};

export const testimonialCrud = {
  repository: testimonialRepository,
  dto: TestimonialDto,
  listQuery: ListContentQueryDto,
  tags: [CacheTag.TESTIMONIALS, CacheTag.HOME],
  assetFields: [{ name: "avatar", policy: contentImagePolicy }],
  assetFolder: "ztes/testimonials",
};
