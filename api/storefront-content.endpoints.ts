import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";
import type { SearchResultView } from "src/common/types/storefront";

export const STOREFRONT_CONTENT_ROUTES = {
  search: "/search",
  newsletter: "/newsletter",
} as const;

export const searchEndpoint: Endpoint<{ returnType: SearchResultView; query: { q: string } }> = {
  url: STOREFRONT_CONTENT_ROUTES.search,
  methodType: MethodType.GET,
};

export const newsletterEndpoint: Endpoint<{
  returnType: { subscribed: boolean };
  body: { email: string; locale: "ar" | "en" };
}> = { url: STOREFRONT_CONTENT_ROUTES.newsletter, methodType: MethodType.POST };

export const productsByIdsEndpoint: Endpoint<{ returnType: import("src/common/types/storefront").ProductCardView[]; query: { ids: string[] } }> = {
  url: "/products",
  methodType: MethodType.GET,
};

export const productDetailEndpoint: Endpoint<{
  returnType: import("src/common/types/storefront").ProductDetailView;
  params: { id: string };
}> = { url: "/products/:id", methodType: MethodType.GET };
