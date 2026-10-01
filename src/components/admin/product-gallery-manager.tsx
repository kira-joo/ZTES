"use client";

import {
  productImageDeleteEndpoint,
  productImageOrderEndpoint,
  productImageUploadEndpoint,
  type ProductEntity,
} from "src/common/api/admin-products.endpoints";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toAppError, uploadRequester, useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { EmptyState, toast } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

export interface ProductGalleryManagerProps {
  productId: string;
  images: ProductEntity["images"];
  onChanged: (images: ProductEntity["images"]) => void;
}

interface SortableThumbProps {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  onDelete: () => void;
  deleting: boolean;
}

function SortableThumb({ publicId, secureUrl, width, height, onDelete, deleting }: SortableThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: publicId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, aspectRatio: `${width} / ${height}` }}
      className={`group relative flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- gallery thumbnail from Cloudinary, not a page image */}
      <img src={secureUrl} alt="" className="size-full object-contain" />
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 flex size-7 items-center justify-center rounded bg-white/90 text-slate-500 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Delete image"
        disabled={deleting}
        onClick={onDelete}
        className="absolute right-1 top-1 flex size-7 items-center justify-center rounded bg-white/90 text-red-600 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

const MAX_IMAGES = 20;

/**
 * Upload-one-per-request, drag-reorder, delete gallery — a separate
 * sub-resource from the product's own JSON create/update, so it only
 * appears on the edit page (a new product has no id for it to target yet).
 */
export function ProductGalleryManager({ productId, images, onChanged }: ProductGalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orderMutation = useRequesterMutation({ endpoint: productImageOrderEndpoint });
  const deleteMutation = useRequesterMutation({ endpoint: productImageDeleteEndpoint });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      toast.error("Gallery full", `A product holds at most ${MAX_IMAGES} images.`);
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadRequester({ endpoint: productImageUploadEndpoint, options: { params: { id: productId } }, file, fieldName: "file" });
      onChanged([...images, asset]);
      toast.success("Image uploaded");
    } catch (error) {
      const appError = await toAppError(error);
      toast.error("Upload failed", appError.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    setDeletingId(publicId);
    try {
      // No manual toast on failure: `deleteMutation` is a real react-query
      // mutation on the shared client, so its rejection already surfaces
      // through the global error toast (see `adminQueryClient`) — adding a
      // second one here would show it twice.
      await deleteMutation.mutateAsync({ params: { id: productId }, query: { publicId } });
      onChanged(images.filter((image) => image.publicId !== publicId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((image) => image.publicId === active.id);
    const newIndex = images.findIndex((image) => image.publicId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...images];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved!);
    onChanged(reordered);
    try {
      await orderMutation.mutateAsync({ params: { id: productId }, body: { publicIds: reordered.map((image) => image.publicId) } });
    } catch {
      onChanged(images); // revert on failure — the global toast already reported it
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <EmptyState icon={ImagePlus} title="No images yet" description="The first image is the card's main photo; the second is its hover image." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((image) => image.publicId)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {images.map((image) => (
                <SortableThumb
                  key={image.publicId}
                  publicId={image.publicId}
                  secureUrl={image.secureUrl}
                  width={image.width}
                  height={image.height}
                  deleting={deletingId === image.publicId}
                  onDelete={() => handleDelete(image.publicId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          {uploading ? "Uploading…" : "Add image"}
        </button>
      </div>
    </div>
  );
}
