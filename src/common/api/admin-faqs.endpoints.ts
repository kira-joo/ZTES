import { createCrudEndpoints, MethodType } from "@kira-joo/frontend-toolkit-core/server";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import type { AdminPaginationQuery } from "./admin-shared.types";

export interface FaqEntity {
  _id: string;
  question: LocalizedString;
  answer: LocalizedString;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaqFormValues {
  question: LocalizedString;
  answer: LocalizedString;
  sortOrder?: number;
  isActive?: boolean;
}

export const faqCrudEndpoints = createCrudEndpoints<FaqEntity, FaqFormValues, FaqFormValues, AdminPaginationQuery>({
  baseUrl: "/faqs",
  updateMethod: MethodType.PUT,
});
