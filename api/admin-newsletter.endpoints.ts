import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { AdminPaginationQuery } from "./admin-shared.types";

export interface NewsletterSubscriberEntity {
  _id: string;
  email: string;
  locale: "ar" | "en";
  createdAt: string;
}

export const NEWSLETTER_ROUTES = {
  collection: "/newsletter",
  item: "/newsletter/:id",
} as const;

export const newsletterListEndpoint: Endpoint<{
  query: AdminPaginationQuery & Record<string, unknown>;
  returnType: { data: NewsletterSubscriberEntity[]; total: number; page?: number; limit?: number; totalPages?: number };
}> = { url: NEWSLETTER_ROUTES.collection, methodType: MethodType.GET };

export const newsletterDeleteEndpoint: Endpoint<{ params: { id: string }; returnType: unknown }> = {
  url: NEWSLETTER_ROUTES.item,
  methodType: MethodType.DELETE,
};
