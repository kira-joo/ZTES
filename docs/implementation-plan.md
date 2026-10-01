# ZTES — implementation plan

Status: **current** as of 2026-09-30 (revised same day by the scope-simplification
correction below). Supersedes the audit-phase plan delivered in chat. The
reference audit (Orkida, a Salla store) and the workspace audit are summarised
here only where they drive a decision.

## Scope correction (2026-09-30): small commerce backend, not a CMS

Mid-implementation, admin management had started extending to FAQ, testimonials,
home sections, static pages, blog posts and store settings — turning ZTES into a
content-management system. That is explicitly not the goal. **This section is
authoritative and overrides any earlier line in this document that conflicts
with it** (the "Admin" row in Explicit ZTES decisions, the data model table, the
phase list, and the reference-features list below are corrected in place to
match).

**Admin manages only dynamic commerce data**: Products, Categories, Coupons,
Orders. Nothing else gets a CRUD screen, an admin API route, or a database
collection whose only purpose is admin editability.

| Static (app content, no DB row, no admin screen) | Dynamic (Admin-managed) |
|---|---|
| Home page sections (hero, tiles, banners, trust strip, FAQ, testimonials, blog rail) | Products |
| FAQ | Categories |
| Testimonials | Coupons |
| Static pages (about, terms, privacy, shipping/return policy) | Orders |
| Blog posts | |
| Store identity/contact/social/branches/footer/delivery fee/VAT rate/safe-use text | |

A thing not expected to change through normal store operation does not get
database CRUD. Where a static section's content is naturally backed by a real
catalog entity — a category tile, a product-rail's products, a spotlight
product, a brand-carousel logo — the section's **layout/config** is static
(which category, which criteria, in what order) but the **data shown** is
still read live from the real `categories`/`products`/`brands` collections, so
it never goes stale when an admin edits the catalog.

**Removed entirely** (collection, schema, repository, DTOs, admin UI, admin API):
`HomeSection`, `Faq`, `Testimonial`, `Page`, `Post`, `StoreSettings`. Their
content now lives in `src/content/*.ts`, imported directly by
`src/server/storefront/content.reads.ts`, which keeps its previous exported
function signatures so no storefront consumer changed.

**Kept as Mongo but with zero admin CRUD surface** (pragmatic exceptions, both
genuinely tied to a dynamic, Admin-owned entity rather than free-standing
content):
- `brands` — products reference a brand, and brand identity (logo, name) can
  reasonably change without a code deploy; but the final admin nav has no
  "Brands" item, so create/edit/delete happen only via the reference importer.
  A read-only list endpoint remains for the product form's brand picker.
- `reviews` — reference-seeded plus buyer-submitted (from a delivered order, the
  no-accounts stand-in for "verified purchase"). There is no admin
  review-management screen; a submitted review **publishes immediately**
  (previously it waited for admin moderation, which no longer exists as a
  concept — a moderation queue with no moderator screen is a dead end, not a
  simplification).

**`newsletter_subscribers` stays**, because a subscriber list is user-submitted
data, not editorial content — but its admin list screen is removed along with
the rest of the Content nav section; nothing reads the list back except direct
database access if ever needed.

**Deliberately not reproduced from the scrape, and why**: Orkida's real phone
number, WhatsApp number, email and social-media handles are a different real
business's actual contact channels — publishing them as ZTES's own would
misdirect real people to a third party. Orkida's VAT/CR numbers and VAT
certificate are that company's real legal registration, not ZTES's. Orkida's
scraped customer testimonials carry real named individuals' quotes about their
experience with Orkida specifically — presenting them as ZTES's own customers
would be a fabricated endorsement. The **static content module structurally
reproduces every one of these sections** (contact block, legal block,
testimonials block all render) but with neutral/placeholder values instead of
copied real-world identity, and testimonials are rewritten as generic,
non-attributed quotes rather than reusing scraped names. Product/brand data is
unaffected by this — a reseller legitimately carries real manufacturer brand
names, which is a different situation from claiming another retailer's
identity as your own.

Branch pickup was already excluded (Riyadh delivery only, no per-branch stock);
the home page's `BRANCH_MAP` section is dropped for the same reason rather than
rendered with fabricated branches.

### Temporary: local demo images for initial client handoff (2026-10-01)

Cloudinary is not yet configured, so every imported product/category/brand
image field was empty. For the initial handoff the storefront needs to look
visually complete, so `npm run reference:seed -- --demo-images` fills every
image field with one of 11 reference-site product photos copied into
`public/images/demo/` (`scripts/reference/lib/local-demo-images.ts`), picked
deterministically from the field's source URL so re-seeding never shuffles
which photo an item shows. Reuse across many products is expected and fine.

**This is not a second image architecture.** Every value is an ordinary
`ImageAsset` — the same shape Cloudinary produces — just pointing at a local
`/public` path; `StoreImage` and every other consumer render it identically
either way, and Admin replaces any of them later through the existing
Cloudinary upload flow with no code change.

**Most reference product photos carry Orkida's identity.** Orkida stamps a
semi-transparent "أوركيدا / orkidaagri / orkidastore.com" watermark over most of
its product photos, and some are marketing graphics with its phone number,
Instagram handle and card-payment badges — roughly 90% of ~410 images
screened. The only reliable check is full resolution after histogram
equalization; thumbnails and white-background contrast tricks miss a watermark
sitting over coloured packaging (two earlier versions of this pool shipped
branded images that way, one with Orkida's phone number as the home hero). The
11 in the pool passed the full-resolution check — never add an image unseen.

**Consequence for the real import:** `npm run reference:seed -- --overwrite`
with Cloudinary configured would upload the reference site's *own* photos —
watermarks included — as ZTES product images. Do not run the real image import
for a public launch; product images should come from the client (or the
manufacturers) through Admin.

## Rule of parity

If a feature exists on the reference site (orkidastore.com) and does not
conflict with an explicit ZTES decision below — including the scope correction
above — ZTES implements it. Every exclusion is listed with its reason in
[Excluded](#excluded-reference-features).

## Explicit ZTES decisions

| Area | Decision |
|---|---|
| Payment | `CASH_ON_DELIVERY` only. No gateway abstraction. |
| Delivery | Riyadh only, one delivery method. Fee, free-shipping threshold and area text are admin settings. No branch pickup. |
| Customers | Guest checkout only. No accounts, no OTP. First name, last name, phone, email, address. Phone and email are unique identifiers. |
| Admin | `/admin` in this app. English UI. One admin, password from `ADMIN_PASSWORD`. All customer-facing content fields are `{ ar, en }`. Manages **only** Products, Categories, Coupons, Orders — see [Scope correction](#scope-correction-2026-09-30-small-commerce-backend-not-a-cms). |
| Architecture | The `@kira-joo/*` 1.0.x packages and the `restaurant-platform(-staff)` patterns. No major-version upgrades. |

## Architecture (one Next app)

- `src/app/[locale]/…` storefront (next-intl, `ar` default, prefix always, detection off).
- `src/app/admin/…` admin, outside `[locale]`, English only.
- `src/app/api/storefront/**` public routes (`auth: false`, `force-dynamic`).
- `src/app/api/admin/**` admin routes (`auth: true`).
- `src/server/**` schemas, DTOs, repositories, pure engines, storefront reads.
- `api/*.endpoints.ts` the browser-side `Endpoint` contract (fetch adapter only — same origin).

Differences from the two-repo precedent, and why:

- **Cache invalidation is in-process.** `configureNextBackendToolkit({ cache: { publishRevalidation } })`
  calls `revalidateTag` directly; there is no publish/receive HTTP hop or shared secret.
- **Storefront reads do not go over HTTP.** Server Components call `src/server/storefront/*.reads.ts`,
  cached with `unstable_cache` and tagged with the same `CacheTag` values the admin routes declare.
- **Admin auth has no user collection.** `resolveUser` returns a constant admin for the fixed subject
  id; `tokenVersion` comes from `ADMIN_TOKEN_VERSION`. The reference session shape is kept: a
  short-lived access cookie plus a rotating, reuse-detected refresh cookie scoped to
  `/api/admin/auth/token`, using `backend-toolkit-mongoose`'s refresh-token primitives.

## Data model

Money is `moneyField()` (Decimal128) everywhere; customer-facing text is `localizedStringField()`.
Every imported document carries `legacy.sallaId` (unique, sparse) so the importer is re-runnable.

| Collection | Purpose |
|---|---|
| `categories` | 3-level tree: name, `slug{ar,en}`, description, parent, image, icon, banner, sortOrder, isActive, showInMenu, seo |
| `brands` | name, `slug{ar,en}`, logo, description (sanitised HTML), sortOrder, isActive, seo |
| `products` | name, `slug{ar,en}`, description (sanitised HTML), sku, brand, `categories[]` (many-to-many), primaryCategory, `images[]` (0 = main, 1 = hover), price, compareAtPrice, saleEndsAt, stock, trackStock, weight, embedded `options[].values[]` (priceDelta, image, isAvailable), badge, quantity-discount tiers, isActive, isFeatured, ratingAverage/ratingCount/soldCount, searchText, seo |
| `reviews` | product, authorName, rating, body, isPublished, order (when written by a buyer) |
| `customers` | firstName, lastName, phone (E.164, unique), email (unique), lastAddress, order counters |
| `orders` | orderNumber `YYMMDD-NNNN` (Asia/Riyadh), customer, contact / address / lines / pricing / coupon / gift / safe-use snapshots, paymentMethod, status + append-only timeline, accessTokenHash, contactMismatch |
| `carts` | cartToken (cookie), lines `{product, optionValueIds, quantity}`, couponCode, gift draft, expiresAt (TTL). Totals are never stored. |
| `coupons` | code, PERCENT/FIXED, value, minSubtotal, maxDiscount, freeShipping, window, usageLimit, usedCount, isActive |
| `order_sequences`, `idempotency_records`, `rate_limits`, `admin_refresh_tokens` | infrastructure, copied from the precedent |
| `newsletter_subscribers` | signups only (email, locale) — no admin screen |

Store identity/contact/social/legal/delivery/VAT/safe-use text, home sections,
static pages, the blog and FAQs/testimonials are **not** collections — see the
scope correction above. They live in `src/content/*.ts`.

### Pricing (pure engine, `src/server/engines/pricing`)

1. line unit = `price + Σ option priceDelta`; line gross = unit × quantity
2. quantity tier: the best tier whose `minQuantity ≤ quantity` discounts the line by its percent
3. subtotal = Σ line net
4. coupon: PERCENT of subtotal (capped by maxDiscount) or FIXED (capped at subtotal)
5. shipping = 0 when coupon.freeShipping or `subtotal − coupon ≥ freeShippingThreshold`, else fee
6. total = subtotal − coupon + shipping; `vatIncluded = total × rate ÷ (100 + rate)`

Round once per stored amount (line net, discount, totals). Divide, never multiply by a reciprocal.

### Customer matching (pure engine, inside the placement transaction)

Normalise phone to `+9665XXXXXXXX` and email to lower case. Match by phone, then by email. No
match → create. Match → attach; refresh name and last address only; never overwrite a stored phone
or email from guest input. Phone matches A while email belongs to B → attach to A, set
`contactMismatch`. Checkout never fails on identity and never reveals which customers exist.

## Reference features in scope

Storefront: marquee announcement bar; sticky header; mega menu + right-side drill-down drawer;
language modal; search modal with admin-curated suggestions and live results (plus `/search`);
home sections as above; product cards with hover image, badge, rating, wishlist, **quick view**,
inline add-to-cart; category/brand/offers listings with sub-category and brand filters (counts),
the five Orkida sort options, pagination; product page with gallery + lightbox, options,
quantity, add-to-cart, **buy now**, sticky mobile bar, countdown, copyable coupon, purchase count,
description, details, reviews (list + buyer submission), related and "customers also viewed" rows,
out-of-stock alternatives; **wishlist** page; cart with quantity-tier upsell, related products,
safe-use acknowledgement, free-shipping progress, **gift sending**, **coupon**, VAT-split summary;
single-page guest checkout; order confirmation / status page; static pages; brands index; blog;
newsletter; FAQ; testimonials; branch map block; floating WhatsApp; VAT certificate modal;
promotional popup; back-to-top; 404.

Admin (scope-corrected, see above): dashboard; products (images, options, tiers, badges, stock,
SEO); categories (tree order); coupons; orders (status transitions, cancel with restock, customer
info shown inline — no separate customers screen). Brand create/edit/delete, review moderation,
home sections, pages, posts, FAQs, testimonials, newsletter list and settings are **not** admin
screens; see the scope correction.

## Excluded reference features

| Reference feature | Reason |
|---|---|
| mada, cards, Apple Pay, STC Pay, bank transfer, Tabby, Tamara, BNPL widgets | Explicit decision: COD only |
| Cashback wallet ("استرد 10%…") | Needs customer accounts and wallet payment — both excluded |
| Customer login / OTP / account pages / social login | Explicit decision: guest checkout only |
| Branch pickup, "check branch availability" | Explicit decision: Riyadh delivery only, no pickup; there is no per-branch stock |
| Choice of shipping company, multi-city delivery | Explicit decision: one Riyadh delivery method |
| Courier (SMSA) tracking link | Replaced by ZTES's own order-status page; there is no courier integration |
| Live "N people browsing now" counter | Would display a number ZTES does not measure — fabricated social proof |
| Live chat widget, third-party Salla app blocks | Third-party SaaS embeds, not store functionality; no provider in the workspace |
| Home page branch-map block | No branch pickup / no per-branch stock (same reason as branch pickup above) |
| Admin CRUD for home sections, pages, posts, FAQs, testimonials, newsletter list, settings, brand write, review moderation | Scope correction 2026-09-30: not dynamic commerce data — see above |
| Orkida's real phone/WhatsApp/email/social handles, VAT/CR numbers, VAT certificate, named customer testimonials | These identify a different real business or real individuals; reused as ZTES's own they would misdirect people or fabricate endorsement — see scope correction |

Wishlist note: Orkida's wishlist is account-bound. Without accounts ZTES keeps it on the device
(`localStorage`, a per-viewer convenience — never a token).

## Dependencies beyond the precedent

| Package | Why | Where |
|---|---|---|
| `embla-carousel-react` | Carousels (precedent: `nutrition-client`) | storefront |
| `@dnd-kit/*` | Reordering (precedent: `restaurant-platform-staff`) | admin |
| `sanitize-html` | Imported and admin-authored HTML is sanitised on write; no toolkit equivalent | server |
| `@tiptap/*` | Rich-text editing for product/category descriptions; no toolkit editor exists | admin |
| `node-html-parser` | Parsing reference HTML in the importer | scripts only |

## Phases

1. Skeleton, core infrastructure, local replica set, env contract, test harness
2. Schemas, repositories, pure engines + tests
3. Admin auth
4. Reference importer (scrape → local snapshot → seed via repositories → Cloudinary)
5. Admin catalog (products, categories, brands, reviews, coupons)
6. Storefront shell (header, menu, drawer, footer, fonts, direction, tokens)
7. Home sections
8. Listings (category, brand, offers, search) with filters/sort/pagination
9. Product page, quick view, wishlist
10. Cart (tiers, coupon, gift, safe-use, free-shipping progress)
11. Checkout, placement, confirmation, buyer reviews (auto-published, no moderation)
12. Admin orders, dashboard
13. Static content module (`src/content/*.ts`): store config, home sections, FAQ, testimonials,
    static pages, blog — sourced from the reference scrape where safe to reuse, rewritten where the
    source data is Orkida's own identity (contact/social/legal/testimonials)
14. Static pages, blog, brands index (brand data still live from `brands`), 404
15. SEO (metadata, canonical + hreflang, sitemap, robots, JSON-LD incl. BreadcrumbList)
16. End-to-end and parity QA at 390/768/1440 in both locales

Each phase ends with typecheck, lint, tests, and — from phase 6 on — a real-browser check.
