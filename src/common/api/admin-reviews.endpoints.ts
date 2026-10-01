import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminPaginationQuery } from "./admin-shared.types";

export interface ReviewProductSummary {
  _id: string;
  name: LocalizedString;
  slug: { ar: string; en: string };
}

export interface ReviewEntity {
  _id: string;
  product: ReviewProductSummary | string;
  authorName: string;
  rating: number;
  body: string;
  isPublished: boolean;
  reviewedAt: string;
  createdAt: string;
}

export interface ListReviewsQuery extends AdminPaginationQuery {
  product?: string;
  isPublished?: boolean;
}

export interface ReviewUpdateBody {
  isPublished?: boolean;
  authorName?: string;
  body?: string;
  rating?: number;
}

export const REVIEW_ROUTES = {
  collection: "/reviews",
  item: "/reviews/:id",
} as const;

export const reviewListEndpoint: Endpoint<{
  query: ListReviewsQuery & Record<string, unknown>;
  returnType: { data: ReviewEntity[]; total: number; page?: number; limit?: number; totalPages?: number };
}> = { url: REVIEW_ROUTES.collection, methodType: MethodType.GET };

export const reviewUpdateEndpoint: Endpoint<{
  params: { id: string };
  body: ReviewUpdateBody;
  returnType: ReviewEntity;
}> = { url: REVIEW_ROUTES.item, methodType: MethodType.PUT };

export const reviewDeleteEndpoint: Endpoint<{ params: { id: string }; returnType: { deleted: boolean } }> = {
  url: REVIEW_ROUTES.item,
  methodType: MethodType.DELETE,
};
