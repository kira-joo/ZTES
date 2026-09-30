import type { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import type { MongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import type { ClassConstructor } from "src/server/core/dto/transform";
import { ObjectIdParamsDto } from "src/server/core/dto/params.dto";
import { createDeleteRoute, createGetRoute, createPostRoute, createPutRoute } from "src/server/core/route-factories";
import { cleanupReplacedAssets, parseEntityPayload, persistWithAssets, type AssetFields } from "./entity-payload";

/**
 * The admin CRUD shape shared by every simple resource: list, create, read,
 * replace (PUT), delete. Every route requires the admin (`auth: true`) and
 * declares the storefront cache tags its writes invalidate.
 *
 * Resources with real rules (products, orders, settings) write their own
 * routes and reuse only the payload helpers.
 */
export interface AdminCrudOptions<T, TDto extends object, TQuery extends BaseFindQueryDto> {
  repository: MongooseRepository<T>;
  dto: ClassConstructor<TDto>;
  listQuery: ClassConstructor<TQuery>;
  tags: string[];
  assetFields?: AssetFields;
  assetFolder?: string;
  /** Maps a validated DTO to the stored shape (sanitising, id casting). */
  toEntity?: (dto: TDto, context: { id?: string }) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeDelete?: (id: string) => Promise<void>;
  /** Hard delete by default; soft-deletable schemas pass `softDelete`. */
  softDelete?: boolean;
  relations?: string[];
}

export function adminCollectionRoutes<T, TDto extends object, TQuery extends BaseFindQueryDto>(
  options: AdminCrudOptions<T, TDto, TQuery>
) {
  const folder = options.assetFolder ?? "ztes/content";
  return {
    GET: createGetRoute({
      auth: true,
      query: options.listQuery,
      handler: async ({ query }) =>
        options.repository.findAllAndCountPublic({
          query,
          ...(options.relations ? { relations: options.relations } : {}),
        } as never),
    }),
    POST: createPostRoute({
      auth: true,
      successStatus: 201,
      handler: async ({ request }) => {
        const parsed = await parseEntityPayload(request, options.dto, options.assetFields ?? [], folder);
        const entity = options.toEntity ? await options.toEntity(parsed.dto, {}) : parsed.dto;
        return persistWithAssets(parsed, () => options.repository.save(entity as never));
      },
      revalidateTags: options.tags,
    }),
  };
}

export function adminItemRoutes<T, TDto extends object, TQuery extends BaseFindQueryDto>(
  options: AdminCrudOptions<T, TDto, TQuery>
) {
  const folder = options.assetFolder ?? "ztes/content";
  return {
    GET: createGetRoute({
      auth: true,
      params: ObjectIdParamsDto,
      handler: async ({ params }) =>
        options.repository.findOne({
          where: { _id: params.id },
          ...(options.relations ? { relations: options.relations } : {}),
        } as never),
    }),
    PUT: createPutRoute({
      auth: true,
      params: ObjectIdParamsDto,
      handler: async ({ request, params }) => {
        const previous = await options.repository.findOne({ where: { _id: params.id } } as never);
        const parsed = await parseEntityPayload(request, options.dto, options.assetFields ?? [], folder);
        const entity = options.toEntity ? await options.toEntity(parsed.dto, { id: params.id }) : parsed.dto;
        const updated = await persistWithAssets(parsed, () =>
          options.repository.update({ where: { _id: params.id } } as never, entity as never)
        );
        await cleanupReplacedAssets(parsed, previous as object);
        return updated;
      },
      revalidateTags: options.tags,
    }),
    DELETE: createDeleteRoute({
      auth: true,
      params: ObjectIdParamsDto,
      handler: async ({ params }) => {
        await options.beforeDelete?.(params.id);
        if (options.softDelete) return options.repository.softDelete({ where: { _id: params.id } } as never);
        return options.repository.delete({ where: { _id: params.id } } as never);
      },
      revalidateTags: options.tags,
    }),
  };
}
