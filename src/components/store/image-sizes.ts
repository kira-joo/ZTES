/**
 * `sizes` for an image spanning the storefront page shell's full content width:
 * `max-w-[1440px]` with `px-3` (24px total) below md and `md:px-4` (32px) above,
 * so it is never actually `100vw`. Measured: 351px at 375, 1408px at 1440 and
 * at 1920.
 */
export const PAGE_CONTENT_SIZES = "(min-width: 1440px) 1408px, (min-width: 768px) calc(100vw - 32px), calc(100vw - 24px)";
