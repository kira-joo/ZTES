"use client";

import { categoryCrudEndpoints, categoryReorderEndpoint, type CategoryEntity } from "src/common/api/admin-categories.endpoints";
import { useRequesterMutation, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { useConfirm } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { EmptyState, PageShell, QueryState, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { ChevronDown, ChevronUp, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { pickLocalized } from "src/lib/localized";
import { useRouter } from "next/navigation";

interface TreeNode extends CategoryEntity {
  children: TreeNode[];
}

function buildTree(categories: CategoryEntity[]): TreeNode[] {
  const byParent = new Map<string, CategoryEntity[]>();
  for (const category of categories) {
    const key = category.parent ?? "root";
    const bucket = byParent.get(key) ?? [];
    bucket.push(category);
    byParent.set(key, bucket);
  }
  for (const bucket of byParent.values()) bucket.sort((a, b) => a.sortOrder - b.sortOrder);

  function attach(parentKey: string): TreeNode[] {
    return (byParent.get(parentKey) ?? []).map((category) => ({ ...category, children: attach(category._id) }));
  }

  return attach("root");
}

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  siblings: TreeNode[];
  index: number;
  onMove: (node: TreeNode, direction: "up" | "down", siblings: TreeNode[], index: number) => void;
  onDelete: (node: TreeNode) => void;
}

function TreeRow({ node, depth, siblings, index, onMove, onDelete }: TreeRowProps) {
  const router = useRouter();

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0"
        style={{ paddingInlineStart: depth * 24 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <FolderTree className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate font-medium text-slate-900">{pickLocalized(node.name, "en")}</span>
          {!node.isActive && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Inactive</span>}
          {!node.showInMenu && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Hidden from menu</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Move ${pickLocalized(node.name, "en")} up`}
            disabled={index === 0}
            onClick={() => onMove(node, "up", siblings, index)}
            className="flex size-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Move ${pickLocalized(node.name, "en")} down`}
            disabled={index === siblings.length - 1}
            onClick={() => onMove(node, "down", siblings, index)}
            className="flex size-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Edit ${pickLocalized(node.name, "en")}`}
            onClick={() => router.push(`/admin/categories/${node._id}`)}
            className="flex size-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${pickLocalized(node.name, "en")}`}
            onClick={() => onDelete(node)}
            className="flex size-8 items-center justify-center rounded text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {node.children.map((child, childIndex) => (
        <TreeRow key={child._id} node={child} depth={depth + 1} siblings={node.children} index={childIndex} onMove={onMove} onDelete={onDelete} />
      ))}
    </>
  );
}

export function CategoryTreeView() {
  // The server caps `limit` at 100 (`getFindQueryDefaults().maxLimit`) — the
  // admin's own category tree has nowhere near that many nodes in practice.
  const query = useRequesterQuery({ endpoint: categoryCrudEndpoints.get, options: { query: { limit: 100, sortBy: "sortOrder", sortOrder: "ASC" } } });
  const reorderMutation = useRequesterMutation({ endpoint: categoryReorderEndpoint });
  const deleteMutation = useRequesterMutation({ endpoint: categoryCrudEndpoints.delete });
  const { confirm } = useConfirm();

  const tree = useMemo(() => buildTree(query.data?.data ?? []), [query.data]);

  const handleMove = async (node: TreeNode, direction: "up" | "down", siblings: TreeNode[], index: number) => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const other = siblings[swapIndex];
    if (!other) return;
    await reorderMutation.mutateAsync({
      body: {
        items: [
          { id: node._id, sortOrder: other.sortOrder },
          { id: other._id, sortOrder: node.sortOrder },
        ],
      },
    });
    query.refetch();
  };

  const handleDelete = async (node: TreeNode) => {
    const confirmed = await confirm({
      title: `Delete "${pickLocalized(node.name, "en")}"?`,
      description: "A category with children or products cannot be deleted.",
      destructive: true,
    });
    if (!confirmed) return;
    // No catch here: the mutation's own failure already surfaces through the
    // shared QueryClient's global error toast (see `adminQueryClient` in
    // admin-providers.tsx) — for example the server's "has children or
    // products" refusal. Adding a second toast here would show it twice.
    await deleteMutation.mutateAsync({ params: { id: node._id } });
    toast.success("Category deleted");
    query.refetch();
  };

  return (
    <PageShell
      title="Categories"
      description="Up to three levels deep. Reorder with the arrows; reparent from the edit page."
      actions={
        <RouteButton path="/admin/categories/new" leftIcon={Plus}>
          Add category
        </RouteButton>
      }
    >
      <QueryState query={query} entityName="Categories">
        {() =>
          tree.length === 0 ? (
            <EmptyState icon={FolderTree} title="No categories yet" description="Create the first one to start building the menu." />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              {tree.map((node, index) => (
                <TreeRow key={node._id} node={node} depth={0} siblings={tree} index={index} onMove={handleMove} onDelete={handleDelete} />
              ))}
            </div>
          )
        }
      </QueryState>
    </PageShell>
  );
}
