/**
 * End-to-end smoke test against a RUNNING server (default http://localhost:3030):
 * admin login → create category + product → guest cart → place a COD order
 * (twice with one Idempotency-Key) → read it back → admin transitions → cancel
 * restores stock. Uses ADMIN_PASSWORD from .env without printing it.
 *
 *   npm run smoke            (tsx --env-file=.env scripts/smoke.ts)
 *
 * Creates data prefixed `smoke-` in whatever database the server uses.
 */
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3030";

class Jar {
  private values = new Map<string, string>();
  absorb(response: Response) {
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const [name, ...rest] = pair!.split("=");
      const value = rest.join("=");
      if (value === "" || /max-age=0/i.test(header)) this.values.delete(name!.trim());
      else this.values.set(name!.trim(), value);
    }
  }
  header() {
    return [...this.values.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

async function request(jar: Jar, method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", cookie: jar.header(), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  jar.absorb(response);
  const text = await response.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: response.status, json: json as Record<string, any> };
}

function check(condition: unknown, message: string, detail?: unknown): asserts condition {
  if (!condition) {
    console.error(`✗ ${message}`, detail ?? "");
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function main() {
  const admin = new Jar();
  const guest = new Jar();
  const stamp = Date.now().toString(36);

  check((await request(admin, "GET", "/api/admin/auth/me")).status === 401, "admin API refuses an anonymous caller");
  const badLogin = await request(admin, "POST", "/api/admin/auth/login", { password: "wrong-password-xx" });
  check(badLogin.status === 401, "wrong password is refused");
  const login = await request(admin, "POST", "/api/admin/auth/login", { password: process.env.ADMIN_PASSWORD });
  check(login.status === 200, "admin logs in", login.json);
  check((await request(admin, "GET", "/api/admin/auth/me")).status === 200, "session cookie authenticates");

  const category = await request(admin, "POST", "/api/admin/categories", {
    name: { ar: `اختبار ${stamp}`, en: `Smoke ${stamp}` },
    slug: { ar: `اختبار-${stamp}`, en: `smoke-${stamp}` },
  });
  check(category.status === 201, "admin creates a category", category.json);

  const product = await request(admin, "POST", "/api/admin/products", {
    name: { ar: `منتج ${stamp}`, en: `Smoke product ${stamp}` },
    slug: { ar: `منتج-${stamp}`, en: `smoke-product-${stamp}` },
    description: { ar: "<p>وصف</p><script>alert(1)</script>", en: "<p>Description</p>" },
    categories: [category.json._id],
    price: "89.00",
    compareAtPrice: "109.00",
    stock: 5,
    trackStock: true,
    quantityTiers: [{ minQuantity: 2, percent: 10 }],
  });
  check(product.status === 201, "admin creates a product", product.json);
  check(!String(product.json.description.ar).includes("<script"), "rich text is sanitised on write");
  check(product.json.price === "89.00", "money round-trips as a fixed-scale string", product.json.price);

  const add = await request(guest, "POST", "/api/storefront/cart/items", { productId: product.json._id, quantity: 2 });
  check(add.status === 201 && add.json.itemCount === 2, "guest adds to cart (cookie-backed)", add.json);
  check(add.json.pricing.subtotal === "160.20", "quantity tier applies: 2 × 89 − 10%", add.json.pricing);
  check(add.json.pricing.total === add.json.pricing.subtotal || add.json.pricing.shippingFee !== undefined, "totals computed");

  const order = {
    contact: { firstName: "Smoke", lastName: "Test", phone: "0500000001", email: `smoke-${stamp}@example.sa` },
    address: { district: "العليا", street: "التحلية" },
    safeUseAccepted: true,
    paymentMethod: "CASH_ON_DELIVERY",
    locale: "ar",
  };
  const bad = await request(guest, "POST", "/api/storefront/orders", { ...order, paymentMethod: "CARD" }, { "idempotency-key": `bad-${stamp}` });
  check(bad.status === 400, "any payment method other than COD is rejected", bad.json);

  const key = `smoke-${stamp}`;
  const placed = await request(guest, "POST", "/api/storefront/orders", order, { "idempotency-key": key });
  check(placed.status === 201 && /^\d{6}-\d{4}$/.test(placed.json.orderNumber), "guest places a COD order", placed.json);
  const replay = await request(guest, "POST", "/api/storefront/orders", order, { "idempotency-key": key });
  check(replay.json.orderNumber === placed.json.orderNumber, "replaying the Idempotency-Key returns the same order", replay.json);

  const mine = await request(guest, "GET", `/api/storefront/orders/${placed.json.orderNumber}`);
  check(mine.status === 200 && mine.json.paymentMethod === "CASH_ON_DELIVERY", "guest reads their order via the httpOnly cookie");
  check(mine.json.accessTokenHash === undefined, "the access token hash is never returned");
  const stranger = await request(new Jar(), "GET", `/api/storefront/orders/${placed.json.orderNumber}`);
  check(stranger.status === 404, "another browser cannot read it");

  const stockAfter = await request(admin, "GET", `/api/admin/products/${product.json._id}`);
  check(stockAfter.json.stock === 3, "stock decremented to 3", stockAfter.json.stock);

  const confirm = await request(admin, "PUT", `/api/admin/orders/${placed.json.orderNumber}/status`, { status: "CONFIRMED" });
  check(confirm.status === 200 && confirm.json.status === "CONFIRMED", "admin confirms the order", confirm.json);
  const skip = await request(admin, "PUT", `/api/admin/orders/${placed.json.orderNumber}/status`, { status: "PLACED" });
  check(skip.status === 409, "an invalid transition is refused");
  const cancel = await request(admin, "PUT", `/api/admin/orders/${placed.json.orderNumber}/status`, { status: "CANCELLED", note: "smoke" });
  check(cancel.json.status === "CANCELLED", "admin cancels");
  const restocked = await request(admin, "GET", `/api/admin/products/${product.json._id}`);
  check(restocked.json.stock === 5, "cancelling restores stock", restocked.json.stock);

  await request(admin, "DELETE", `/api/admin/products/${product.json._id}`);
  const logout = await request(admin, "POST", "/api/admin/auth/token/logout");
  check(logout.status === 200, "admin logs out");
  check((await request(admin, "GET", "/api/admin/auth/me")).status === 401, "session is gone after logout");
  console.log("\nSmoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
