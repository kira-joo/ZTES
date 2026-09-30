"use client";

import { homeSectionCrudEndpoints, homeSectionReorderEndpoint, type HomeSectionEntity } from "api/admin-home-sections.endpoints";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRequesterMutation, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { useConfirm } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { CustomSwitch } from "@kira-joo/frontend-toolkit-tailwind/inputs";
import { EmptyState, PageShell, QueryState, RouteButton, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { GripVertical, LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  HERO_SLIDER: "Hero slider",
  TILE_ROW: "Tile row",
  BANNER: "Banner",
  BRAND_CAROUSEL: "Brand carousel",
  SPOTLIGHT: "Spotlight",
  PRODUCT_RAIL: "Product rail",
  TRUST_STRIP: "Trust strip",
  SOCIAL_LINKS: "Social links",
  FAQ: "FAQ",
  BLOG_RAIL: "Blog rail",
  TESTIMONIALS: "Testimonials",
  BRANCH_MAP: "Branch map",
};

interface RowProps {
  section: HomeSectionEntity;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
}

function SortableRow({ section, onToggle, onDelete }: RowProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section._id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 last:border-b-0 ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <button type="button" aria-label={`Drag to reorder ${TYPE_LABEL[section.type]}`} {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500">
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{section.title?.en || section.title?.ar || TYPE_LABEL[section.type]}</p>
        <p className="text-xs text-slate-500">{TYPE_LABEL[section.type] ?? section.type}</p>
      </div>
      <CustomSwitch checked={section.isActive} aria-label={section.isActive ? "Deactivate section" : "Activate section"} onChange={onToggle} />
      <button
        type="button"
        aria-label={`Edit ${TYPE_LABEL[section.type]}`}
        onClick={() => router.push(`/admin/home-sections/${section._id}`)}
        className="flex size-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Delete ${TYPE_LABEL[section.type]}`} onClick={onDelete} className="flex size-8 items-center justify-center rounded text-red-600 hover:bg-red-50">
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function HomeSectionListView() {
  const query = useRequesterQuery({ endpoint: homeSectionCrudEndpoints.get, options: { query: { limit: 100, sortBy: "sortOrder", sortOrder: "ASC" } } });
  const reorderMutation = useRequesterMutation({ endpoint: homeSectionReorderEndpoint });
  const statusMutation = useRequesterMutation({ endpoint: homeSectionCrudEndpoints.update });
  const deleteMutation = useRequesterMutation({ endpoint: homeSectionCrudEndpoints.delete });
  const { confirm } = useConfirm();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [localOrder, setLocalOrder] = useState<HomeSectionEntity[] | null>(null);

  const sections = localOrder ?? query.data?.data ?? [];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = sections;
    const oldIndex = current.findIndex((s) => s._id === active.id);
    const newIndex = current.findIndex((s) => s._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...current];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved!);
    setLocalOrder(reordered);
    try {
      await reorderMutation.mutateAsync({
        body: { items: reordered.map((section, index) => ({ id: section._id, sortOrder: index })) },
      });
      query.refetch();
    } finally {
      setLocalOrder(null);
    }
  };

  return (
    <PageShell
      title="Home sections"
      description="Ordered top-to-bottom on the storefront home page."
      actions={
        <RouteButton path="/admin/home-sections/new" leftIcon={Plus}>
          Add section
        </RouteButton>
      }
    >
      <QueryState query={query} entityName="Home sections">
        {() =>
          sections.length === 0 ? (
            <EmptyState icon={LayoutList} title="No sections yet" description="Add the first block for the home page." />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s._id)} strategy={verticalListSortingStrategy}>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  {sections.map((section) => (
                    <SortableRow
                      key={section._id}
                      section={section}
                      onToggle={async (checked) => {
                        await statusMutation.mutateAsync({
                          params: { id: section._id },
                          body: { type: section.type, title: section.title, sortOrder: section.sortOrder, payload: section.payload, isActive: checked },
                        });
                        query.refetch();
                      }}
                      onDelete={async () => {
                        const confirmed = await confirm({
                          title: `Delete this ${TYPE_LABEL[section.type]?.toLowerCase()}?`,
                          destructive: true,
                        });
                        if (!confirmed) return;
                        await deleteMutation.mutateAsync({ params: { id: section._id } });
                        toast.success("Section deleted");
                        query.refetch();
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )
        }
      </QueryState>
    </PageShell>
  );
}
