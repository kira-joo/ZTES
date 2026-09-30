/** The only payment method. Cash is collected on delivery. */
export enum PaymentMethod {
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
}

export enum OrderStatus {
  PLACED = "PLACED",
  CONFIRMED = "CONFIRMED",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum TimelineActor {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  SYSTEM = "SYSTEM",
}

export enum CouponType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export enum ProductOptionType {
  /** Values render as image tiles (Orkida's "thumbnail"). */
  THUMBNAIL = "THUMBNAIL",
  TEXT = "TEXT",
}

export enum BadgeTone {
  PRIMARY = "PRIMARY",
  SALE = "SALE",
  NEUTRAL = "NEUTRAL",
  DARK = "DARK",
}

/** The five sort options the reference category page offers, in its order. */
export enum ProductSort {
  SUGGESTED = "suggested",
  BEST_SELLING = "best-selling",
  TOP_RATED = "top-rated",
  PRICE_HIGH = "price-high",
  PRICE_LOW = "price-low",
}
