import { cookies } from "next/headers";

/**
 * Guest state lives in httpOnly cookies the backend owns. Page script never
 * reads them; it only sends requests with credentials.
 */
export const CART_COOKIE = "ztes_cart";
export const ORDERS_COOKIE = "ztes_orders";

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const ONE_HUNDRED_EIGHTY_DAYS = 60 * 60 * 24 * 180;
const MAX_REMEMBERED_ORDERS = 20;

function baseOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function readCartToken(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

export async function writeCartToken(token: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, token, baseOptions(THIRTY_DAYS));
}

export async function clearCartToken(): Promise<void> {
  (await cookies()).set(CART_COOKIE, "", { ...baseOptions(0), maxAge: 0 });
}

/** `orderNumber → access token` for orders placed on this device. */
export async function readOrderTokens(): Promise<Record<string, string>> {
  const raw = (await cookies()).get(ORDERS_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function rememberOrderToken(orderNumber: string, token: string): Promise<void> {
  const existing = Object.entries(await readOrderTokens()).filter(([number]) => number !== orderNumber);
  const next = Object.fromEntries([...existing.slice(-(MAX_REMEMBERED_ORDERS - 1)), [orderNumber, token]]);
  (await cookies()).set(ORDERS_COOKIE, JSON.stringify(next), baseOptions(ONE_HUNDRED_EIGHTY_DAYS));
}
