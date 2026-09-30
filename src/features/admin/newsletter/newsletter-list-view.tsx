"use client";

import { newsletterDeleteEndpoint, newsletterListEndpoint, type NewsletterSubscriberEntity } from "api/admin-newsletter.endpoints";
import { getDefaultApiClient, useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { FeatureTable, type FeatureTableHandle, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind/table";
import { CustomButton, PageShell, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { Download, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

/** The server caps `limit` at 100 (`getFindQueryDefaults().maxLimit`). */
const EXPORT_PAGE_SIZE = 100;

function toCsv(rows: NewsletterSubscriberEntity[]): string {
  const header = "email,locale,subscribed_at";
  const lines = rows.map((row) => [row.email, row.locale, row.createdAt].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
  return [header, ...lines].join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function NewsletterListView() {
  const tableRef = useRef<FeatureTableHandle>(null);
  const deleteMutation = useRequesterMutation({ endpoint: newsletterDeleteEndpoint });
  const [exporting, setExporting] = useState(false);

  const columns: TableColumn<NewsletterSubscriberEntity>[] = [
    { key: "email", header: "Email", sortable: true },
    { key: "locale", header: "Locale", render: (row) => (row.locale === "ar" ? "Arabic" : "English") },
    { key: "createdAt", header: "Subscribed", sortable: true, render: (row) => new Date(row.createdAt).toLocaleString("en-SA") },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const client = getDefaultApiClient();
      const all: NewsletterSubscriberEntity[] = [];
      let page = 1;
      // Walks every page — the export is meant to be complete, not just the
      // page currently on screen.
      for (;;) {
        const response = await client.request(newsletterListEndpoint, { query: { page, limit: EXPORT_PAGE_SIZE } });
        all.push(...response.data);
        const totalPages = response.totalPages ?? Math.ceil(response.total / EXPORT_PAGE_SIZE);
        if (page >= totalPages || response.data.length === 0) break;
        page += 1;
      }
      downloadCsv(toCsv(all), `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Exported ${all.length} subscriber${all.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Export failed", "Try again in a moment.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell
      title="Newsletter"
      description="Everyone who signed up on the storefront."
      actions={
        <CustomButton leftIcon={Download} loading={exporting} onClick={handleExport}>
          Export CSV
        </CustomButton>
      }
    >
      <FeatureTable
        ref={tableRef}
        endpoint={newsletterListEndpoint}
        columns={columns}
        entityName="Subscriber"
        searchPlaceholder="Search by email…"
        rowActions={() => [
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            confirm: (subject) => ({ title: `Remove "${subject.email}"?`, destructive: true }),
            onClick: async (subject) => {
              await deleteMutation.mutateAsync({ params: { id: subject._id } });
              toast.success("Subscriber removed");
              tableRef.current?.refetch();
            },
          },
        ]}
        bordered={false}
      />
    </PageShell>
  );
}
