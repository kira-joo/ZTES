// @vitest-environment node
import { toMoney } from "@kira-joo/toolkit-common";
import { describe, expect, it } from "vitest";
import { CustomerModel } from "src/server/commerce/customer.schema";
import { ProductModel } from "src/server/catalog/product.schema";
import { setupTestDatabase } from "src/test/mongo";

setupTestDatabase();

describe("declared indexes", () => {
  it("exist and enforce customer phone and email uniqueness", async () => {
    await CustomerModel.create({ firstName: "A", lastName: "B", phone: "+966500000001", email: "a@x.sa" });
    await expect(
      CustomerModel.create({ firstName: "C", lastName: "D", phone: "+966500000001", email: "c@x.sa" })
    ).rejects.toMatchObject({ code: 11000 });
    await expect(
      CustomerModel.create({ firstName: "C", lastName: "D", phone: "+966500000002", email: "A@X.SA" })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("allow many products without a sku but not two with the same one", async () => {
    const base = { price: toMoney("10.00"), name: { ar: "م", en: "p" } };
    await ProductModel.create({ ...base, slug: { ar: "a1", en: "a1" } });
    await ProductModel.create({ ...base, slug: { ar: "a2", en: "a2" } });
    await ProductModel.create({ ...base, slug: { ar: "a3", en: "a3" }, sku: "S-1" });
    await expect(ProductModel.create({ ...base, slug: { ar: "a4", en: "a4" }, sku: "S-1" })).rejects.toMatchObject({
      code: 11000,
    });
  });
});
