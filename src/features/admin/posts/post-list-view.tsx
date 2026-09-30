"use client";

import { postCrudEndpoints, type PostEntity } from "api/admin-posts.endpoints";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureFilterType, FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { PageShell, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { pickLocalized } from "src/lib/localized";

export function PostListView() {
  const router = useRouter();
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: postCrudEndpoints.delete });

  const columns: TableColumn<PostEntity>[] = [
    {
      key: "cover",
      header: "",
      render: (row) =>
        row.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
          <img src={row.cover.secureUrl} alt="" className="h-10 w-16 rounded object-cover" />
        ) : (
          <div className="h-10 w-16 rounded bg-slate-100" aria-hidden="true" />
        ),
    },
    { key: "title", header: "Title", sortable: true, render: (row) => pickLocalized(row.title, "en") },
    { key: "publishedAt", header: "Published", sortable: true, render: (row) => new Date(row.publishedAt).toLocaleDateString("en-SA") },
    {
      key: "isPublished",
      header: "Status",
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
          {row.isPublished ? "Published" : "Draft"}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Blog posts"
      description="The Pest Library — articles shown on the storefront's blog."
      actions={
        <RouteButton path="/admin/posts/new" leftIcon={Plus}>
          Add post
        </RouteButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={postCrudEndpoints.get}
        columns={columns}
        entityName="Post"
        searchPlaceholder="Search posts…"
        filters={[
          {
            type: FeatureFilterType.SELECT,
            key: "isPublished",
            header: "Status",
            options: [
              { label: "Published", value: "true" },
              { label: "Draft", value: "false" },
            ],
          },
        ]}
        rowActions={(row) => [
          { label: "Edit", icon: Pencil, onClick: () => router.push(`/admin/posts/${row._id}`) },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Delete "${pickLocalized(subject.title, "en")}"?`, destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              tableRef.current?.refetch();
              toast.success("Post deleted");
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
