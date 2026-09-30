import type { IndexDefinition, IndexOptions, Model } from "mongoose";

/**
 * Declares an index on a model's schema, at most once.
 *
 * ## The problem it solves
 *
 * `createMongoModel` returns the CACHED model when one already exists on the
 * connection — which is correct, and is what makes the model importable from
 * anywhere. But an index declared at module scope afterwards:
 *
 * ```ts
 * export const CartModel = createMongoModel(EntityName.CART, CartSchema);
 * CartModel.schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
 * ```
 *
 * runs on every EVALUATION of the module, while the schema it mutates is
 * created only on the first. In Next's dev server a module is evaluated once
 * per compilation and once per route bundle that pulls it in, so the index
 * definition accumulates and Mongoose warns:
 *
 *   [MONGOOSE] Warning: Duplicate schema index on {"expiresAt":1} found.
 *
 * Its suggested cause — `index: true` and `schema.index()` together — is not
 * what happens here, which is why the warning was easy to read as spurious.
 *
 * ## It was noise, and that was verified rather than assumed
 *
 * Every affected index was checked in the running database. All four TTL
 * indexes exist with `expireAfterSeconds: 0`, and both compound order indexes
 * exist — Mongoose collapses identical duplicates and builds one. So nothing
 * was broken.
 *
 * It still gets fixed, because eighteen warnings per boot is the state in which
 * a real one goes unread. That is the same reason a gate is not allowed to be
 * red on arrival.
 *
 * ## What this is NOT for
 *
 * A TTL. `@MongoField({ type: Date, expires: 0 })` declares one on the field,
 * inside the schema class, which runs only when the schema is actually built —
 * so it cannot accumulate and never warned. `password-reset-token.schema.ts`
 * had always done it that way; three sibling models did not, and a comment on
 * one of them asserted that "the schema decorators do not model" a TTL, which
 * was false and sitting six lines from the code that disproved it.
 *
 * So the three TTLs moved onto their fields. What is left here is the case a
 * field option genuinely cannot express: a COMPOUND index. Two on `orders` and
 * one unique pair on `favorites`.
 *
 * `@kira-joo/backend-toolkit-mongoose` declares indexes for `@Unique()` fields
 * and offers nothing for compound ones, so every consumer needing one writes
 * the same module-scope call and inherits the same behaviour. A compound
 * `@Index()` decorator belongs in the package — but that is a shared-package
 * change, and this is a local fix that does not need one.
 *
 * ## Matching on the KEY, not the options
 *
 * Two declarations of the same key with different options are a genuine
 * conflict rather than a duplicate, and the second would silently lose. That is
 * reported instead of ignored: a TTL that has quietly stopped being a TTL is
 * precisely the failure this codebase keeps producing.
 */
export function declareIndexOnce<T>(model: Model<T>, spec: IndexDefinition, options?: IndexOptions): void {
  const wanted = JSON.stringify(spec);

  const existing = model.schema.indexes().find(([declaredSpec]) => JSON.stringify(declaredSpec) === wanted);

  if (!existing) {
    model.schema.index(spec, options);
    return;
  }

  const [, declaredOptions] = existing as [IndexDefinition, IndexOptions | undefined];

  /*
   * Same key, different options. Mongoose keeps the first and the second does
   * nothing, so a TTL added in a later edit would be silently absent — the
   * index would exist, look right in a schema dump, and never expire anything.
   */
  const before = JSON.stringify(normalise(declaredOptions));
  const after = JSON.stringify(normalise(options));

  if (before !== after) {
    console.warn(
      `[db] ${model.modelName}: the index on ${wanted} is already declared with different options. ` +
        `Keeping ${before}; ignoring ${after}. Reconcile them — the second declaration has no effect.`
    );
  }
}

/** Options compared by content, so key order cannot read as a difference. */
function normalise(options: IndexOptions | undefined): Record<string, unknown> {
  if (!options) return {};
  return Object.fromEntries(Object.entries(options).sort(([a], [b]) => a.localeCompare(b)));
}
