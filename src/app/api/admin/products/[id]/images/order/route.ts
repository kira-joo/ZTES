import { BadRequestError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { ImageOrderDto } from "src/server/catalog/dto/catalog.dto";
import { ProductModel } from "src/server/catalog/product.schema";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Reorders the gallery. The list must be exactly the product's current images. */
export const PUT = createPutRoute({
  auth: true,
  params: ObjectIdParamsDto,
  body: ImageOrderDto,
  handler: async ({ params, body }) => {
    const product = await ProductModel.findById(params.id).select("images").lean();
    if (!product) throw new NotFoundError("Product not found.");
    const byId = new Map((product.images ?? []).map((image) => [image.publicId, image]));
    if (body.publicIds.length !== byId.size || body.publicIds.some((id) => !byId.has(id))) {
      throw new BadRequestError("The order must list every current image exactly once.");
    }
    await ProductModel.updateOne({ _id: params.id }, { $set: { images: body.publicIds.map((id) => byId.get(id)) } });
    return { images: body.publicIds.map((id) => byId.get(id)) };
  },
  revalidateTags: ({ params }) => [CacheTag.PRODUCTS, CacheTag.product(params.id), CacheTag.HOME],
});
