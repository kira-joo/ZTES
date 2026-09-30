# ZTES — working contract

One Next.js 16 application: the storefront (`src/app/[locale]`), the admin
(`src/app/admin`) and the API (`src/app/api`). The workspace constitution
(`../CLAUDE.md`) applies in full; this file holds only what is specific to ZTES.
The plan of record is `docs/implementation-plan.md`.

## What must never be got wrong

- **Admin manages only dynamic commerce data: Products, Categories, Coupons,
  Orders.** Nothing else gets a CRUD screen, an admin API route, or a
  collection that exists only to be admin-editable. Home sections, FAQ,
  testimonials, static pages, blog posts and store identity/contact/social/
  delivery/VAT/safe-use text are `src/content/*.ts` — static app content, not
  database rows. `brands` and `reviews` stay in Mongo (seed-populated /
  buyer-submitted) but have zero admin CRUD surface. See
  `docs/implementation-plan.md`'s "Scope correction" section before adding any
  new admin screen or collection — if it isn't Products/Categories/Coupons/
  Orders, it almost certainly belongs in `src/content`, not a new model.
- **Never reuse Orkida's real contact info, social handles, legal/VAT numbers,
  or named customer testimonials as ZTES's own** when authoring static
  content — that misrepresents a different real business or fabricates an
  endorsement. Reproduce the section structurally; use neutral/placeholder
  values instead of the scraped real-world identity. Product/brand names are
  unaffected (a reseller legitimately carries real manufacturer brands).
- **Reference parity.** The storefront reproduces orkidastore.com (a Salla store)
  in structure, flows and interactions. Every intentional difference is listed in
  the plan's "Excluded reference features" with its reason. Do not drop a
  reference feature silently.
- **Cash on delivery only.** `PaymentMethod.CASH_ON_DELIVERY` is the only value
  and the checkout DTO rejects anything else. No gateway abstraction.
- **Riyadh only.** One delivery method; fee, free-shipping threshold and the area
  text are static (`src/content/store-config.ts`), not admin-editable. No branch
  pickup, and no home-page branch-map block for the same reason.
- **Guests only.** No customer accounts. Phone (`+9665XXXXXXXX`) and email are
  each unique on `customers`; matching lives in `src/server/engines/customer-match.ts`.
- **One admin.** `ADMIN_PASSWORD`, no admin collection. Session: 15-minute access
  cookie + rotating refresh cookie scoped to `/api/admin/auth/token`
  (`src/server/core/auth`). Every admin route declares `auth: true`; the proxy
  redirect is cosmetic. `admin-auth.integration.test.ts` sweeps every admin
  handler for a 401 — a new route is covered automatically.
- **Money** is `Decimal` on the server, a fixed-scale string on the wire
  ("89.00"). Raw `Model.find().lean()` returns BSON Decimal128: read it with
  `readMoney` from `src/server/core/money.ts`, never `toMoney` or `Number`.
- **Pricing** has one implementation: `src/server/engines/pricing.ts`, used by
  the cart, checkout and placement.
- **Orders snapshot** everything the customer agreed to (names, prices, options,
  coupon, gift, address, the safe-use text).
- **Cache.** Storefront reads that touch the database (`src/server/storefront/*.reads.ts`)
  are cached under `CacheTag`s; admin routes declare the same tags in
  `revalidateTags`, which the toolkit turns into an in-process `revalidateTag`. A
  new DB-backed read or a new admin write must name its tags. Static content
  (`src/content/*.ts`) needs no cache tag — it only changes on deploy.
- **Content fields are `{ ar, en }`**; the admin UI is English only. UI chrome
  strings are next-intl messages in `src/i18n/messages/<locale>/<namespace>.json`.
- **Rich text** is sanitised on write (`src/server/core/html/sanitize-html.ts`).

## Layout

| Path | Holds |
|---|---|
| `src/server/{catalog,commerce}` | schemas, DTOs, services for Products/Categories/Brands/Reviews/Coupons/Orders/Customers/Cart |
| `src/content` | static storefront content: store config, home sections, FAQ, testimonials, pages, blog |
| `src/server/engines` | pure business rules, each with tests |
| `src/server/storefront` | read models for Server Components — `content.reads.ts` reads `src/content`, `catalog.reads.ts`/others read the database, both cached the same way |
| `src/server/core` | toolkit config, db, auth, assets, CRUD helpers, route factories |
| `src/common/types` | JSON view shapes shared by server and client |
| `api/*.endpoints.ts` | browser `Endpoint` contracts |
| `scripts/reference` | Orkida scrape + seed for Products/Categories/Brands/Reviews (snapshot in gitignored `data/reference`) |

Routes import factories from `src/server/core/route-factories`, never from the
package directly (responses are normalised there).

## Commands

```bash
docker compose up -d        # local replica set on :27021
npm run dev                 # :3030
npm run smoke               # end-to-end HTTP check against the running server
npm run reference:scrape    # fetch the reference snapshot
npm run reference:seed      # load it (Cloudinary required unless --skip-images)
npm run verify              # typecheck, lint, format, tests, build
```
