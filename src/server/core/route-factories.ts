import {
  createDeleteRoute as createDeleteRouteBase,
  createGetRoute as createGetRouteBase,
  createPostRoute as createPostRouteBase,
  createPutRoute as createPutRouteBase,
  isRouteResultWithMeta,
  withRevalidationMeta,
} from "@kira-joo/backend-toolkit-next";
import "./ensure-configured";
import { toPlain } from "./serialization/to-plain";

/**
 * The toolkit's route factories, with every result passed through `toPlain`.
 *
 * Money is Decimal end to end on the server; a response must carry it as a
 * fixed-scale string, because JSON.stringify of a Decimal is not a contract
 * anyone should rely on and a float would be wrong. Routes import factories
 * from here, never from the package, so no route can forget.
 */
function normalizingOptions<TOptions extends { handler: (context: never) => Promise<unknown> }>(
  options: TOptions
): TOptions {
  const inner = options.handler as (context: unknown) => Promise<unknown>;
  return {
    ...options,
    handler: async (context: unknown) => {
      const result = await inner(context);
      if (isRouteResultWithMeta(result)) {
        return withRevalidationMeta(toPlain(result.response), result.meta);
      }
      return toPlain(result);
    },
  } as TOptions;
}

export const createGetRoute: typeof createGetRouteBase = (options) => createGetRouteBase(normalizingOptions(options));
export const createPostRoute: typeof createPostRouteBase = (options) =>
  createPostRouteBase(normalizingOptions(options));
export const createPutRoute: typeof createPutRouteBase = (options) => createPutRouteBase(normalizingOptions(options));
export const createDeleteRoute: typeof createDeleteRouteBase = (options) =>
  createDeleteRouteBase(normalizingOptions(options));
