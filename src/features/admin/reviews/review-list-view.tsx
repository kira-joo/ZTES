"use client";

import {
  reviewDeleteEndpoint,
  reviewListEndpoint,
  reviewUpdateEndpoint,
  type ReviewEntity,
} from "api/admin-reviews.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureFilterType, FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { CustomSwitch } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { modalPresentation, useDialog } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { PageShell, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Star, Trash2 } from "lucide-react";
import { useRef } from "react";
import { pickLocalized } from "src/lib/localized";
import { ReviewEditDialog } from "./review-edit-dialog";

function PublishToggle({ review, onChanged }: { review: ReviewEntity; onChanged: () => void }) {
  const mutation = useRequesterMutation({ endpoint: reviewUpdateEndpoint });

  return (
    <CustomSwitch
      checked={review.isPublished}
      aria-label={review.isPublished ? "Unpublish review" : "Publish review"}
      onChange={async (checked) => {
        await mutation.mutateAsync({ params: { id: review._id }, body: { isPublished: checked } });
        onChanged();
      }}
    />
  );
}

export function ReviewListView() {
  const { openDialog } = useDialog();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: reviewDeleteEndpoint });

  const editReview = (review: ReviewEntity) => {
    openDialog({
      component: ReviewEditDialog,
      props: { review },
      presentation: modalPresentation({ size: "lg" }),
      onSettled: () => tableRef.current?.refetch(),
    });
  };

  const columns: TableColumn<ReviewEntity>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => (typeof row.product === "string" ? row.product : pickLocalized(row.product.name, "en")),
    },
    { key: "authorName", header: "Author", sortable: true },
    {
      key: "rating",
      header: "Rating",
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          {row.rating} <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
        </span>
      ),
    },
    { key: "body", header: "Review", render: (row) => <span className="line-clamp-2 max-w-sm text-slate-600">{row.body}</span> },
    { key: "isPublished", header: "Published", render: (row) => <PublishToggle review={row} onChanged={() => tableRef.current?.refetch()} /> },
  ];

  return (
    <PageShell title="Reviews" description="Moderate published reviews and view pending ones.">
      <FeatureTable
        ref={tableRef}
        endpoint={reviewListEndpoint}
        columns={columns}
        entityName="Review"
        searchPlaceholder="Search reviews…"
        filters={[
          {
            type: FeatureFilterType.SELECT,
            key: "isPublished",
            header: "Status",
            options: [
              { label: "Published", value: "true" },
              { label: "Pending", value: "false" },
            ],
          },
        ]}
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => editReview(row) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Delete this review by "${subject.authorName}"?`, destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              toast.success("Review deleted");
              tableRef.current?.refetch();
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
