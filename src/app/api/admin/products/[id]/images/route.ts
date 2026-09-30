import { BadRequestError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData, validateUploadedFile } from "@kira-joo/backend-toolkit-next";
import { PRODUCT_IMAGE_FIELD } from "src/server/catalog/asset-fields";
import { ProductModel } from "src/server/catalog/product.schema";
import { requireAssetProvider } from "src/server/core/assets";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createDeleteRoute, createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

const MAX_IMAGES = 20;

/** Adds one image to the end of the gallery. One file per request, by design. */
export const POST = createPostRoute({
  auth: true,
  params: ObjectIdParamsDto,
  successStatus: 201,
  handler: async ({ params, request }) => {
    const product = await ProductModel.findById(params.id).select("images").lean();
    if (!product) throw new NotFoundError("Product not found.");
    if ((product.images?.length ?? 0) >= MAX_IMAGES) throw new BadRequestError(`A product holds at most ${MAX_IMAGES} images.`);

    const { files } = await parseMultipartFormData(request);
    const file = files[PRODUCT_IMAGE_FIELD.name];
    if (!file) throw new BadRequestError("Attach an image in the `file` field.");
    validateUploadedFile(file, PRODUCT_IMAGE_FIELD.policy);

    const provider = requireAssetProvider();
    const asset = await provider.uploadImage(file.buffer, { folder: "ztes/products" });
    try {
      await ProductModel.updateOne({ _id: params.id }, { $push: { images: asset } });
    } catch (error) {
      await provider.destroyAsset(asset.publicId, "image").catch(() => undefined);
      throw error;
    }
    return asset;
  },
  revalidateTags: ({ params }) => [CacheTag.PRODUCTS, CacheTag.product(params.id)],
});

/** Removes one image: `?publicId=…` (public ids contain slashes, so not a path segment). */
export const DELETE = createDeleteRoute({
  auth: true,
  params: ObjectIdParamsDto,
  handler: async ({ params, request }) => {
    const publicId = new URL(request.url).searchParams.get("publicId");
    if (!publicId) throw new BadRequestError("publicId is required.");
    const result = await ProductModel.updateOne({ _id: params.id }, { $pull: { images: { publicId } } });
    if (result.modifiedCount === 1) await requireAssetProvider().destroyAsset(publicId, "image").catch(() => undefined);
    return { removed: result.modifiedCount === 1 };
  },
  revalidateTags: ({ params }) => [CacheTag.PRODUCTS, CacheTag.product(params.id)],
});
