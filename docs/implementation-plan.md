# ZTES — implementation plan

Status: **current** as of 2026-09-30. Supersedes the audit-phase plan delivered in
chat. The reference audit (Orkida, a Salla store) and the workspace audit are
summarised here only where they drive a decision.

## Rule of parity

If a feature exists on the reference site (orkidastore.com) and does not
conflict with an explicit ZTES decision below, ZTES implements it. Every
exclusion is listed with its reason in [Excluded](#excluded-reference-features).

## Explicit ZTES decisions

| Area | Decision |
|---|---|
| Payment | `CASH_ON_DELIVERY` only. No gateway abstraction. |
| Delivery | Riyadh only, one delivery method. Fee, free-shipping threshold and area text are admin settings. No branch pickup. |
| Customers | Guest checkout only. No accounts, no OTP. First name, last name, phone, email, address. Phone and email are unique identifiers. |
| Admin | `/admin` in this app. English UI. One admin, password from `ADMIN_PASSWORD`. All customer-facing content fields are `{ ar, en }`. |
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
| `store_settings` | singleton: identity, contact, social, legal (VAT/CR/certificate), announcements, delivery, VAT rate, safe-use text, branches, search suggestions, popup, footer, SEO defaults |
| `home_sections` | ordered, typed sections: HERO_SLIDER, TILE_ROW, BANNER, BRAND_CAROUSEL, SPOTLIGHT, PRODUCT_RAIL, TRUST_STRIP, SOCIAL_LINKS, FAQ, BLOG_RAIL, TESTIMONIALS, BRANCH_MAP |
| `pages`, `posts` | static pages and the "Pest Library" blog |
| `faqs`, `testimonials`, `newsletter_subscribers` | content and signups |

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

Admin: dashboard; products (images, options, tiers, badges, stock, SEO); categories (tree order);
brands; reviews; coupons; orders (status transitions, cancel with restock); customers; home
sections; pages; posts; FAQs; testimonials; newsletter; settings (identity, contact, social,
legal, delivery, VAT, announcements, safe-use text, branches, search suggestions, popup, SEO).

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

Wishlist note: Orkida's wishlist is account-bound. Without accounts ZTES keeps it on the device
(`localStorage`, a per-viewer convenience — never a token).

## Dependencies beyond the precedent

| Package | Why | Where |
|---|---|---|
| `embla-carousel-react` | Carousels (precedent: `nutrition-client`) | storefront |
| `@dnd-kit/*` | Reordering (precedent: `restaurant-platform-staff`) | admin |
| `sanitize-html` | Imported and admin-authored HTML is sanitised on write; no toolkit equivalent | server |
| `@tiptap/*` | Rich-text editing for descriptions, pages, posts; no toolkit editor exists | admin |
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
11. Checkout, placement, confirmation, buyer reviews
12. Admin orders, customers, dashboard
13. Admin content (home sections, pages, posts, FAQs, testimonials, newsletter, settings)
14. Static pages, blog, brands index, 404
15. SEO (metadata, canonical + hreflang, sitemap, robots, JSON-LD incl. BreadcrumbList)
16. End-to-end and parity QA at 390/768/1440 in both locales

Each phase ends with typecheck, lint, tests, and — from phase 6 on — a real-browser check.
