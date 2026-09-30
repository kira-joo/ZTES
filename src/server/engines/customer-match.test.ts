// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decideCustomerMatch } from "./customer-match";

const a = { id: "a", phone: "+966500000001", email: "a@x.sa" };
const b = { id: "b", phone: "+966500000002", email: "b@x.sa" };

describe("decideCustomerMatch", () => {
  it("creates when neither identifier is known", () => {
    expect(decideCustomerMatch({ phone: "+966500000009", email: "new@x.sa", byPhone: null, byEmail: null })).toEqual({
      action: "create",
    });
  });

  it("attaches cleanly when both identifiers belong to the same customer", () => {
    expect(decideCustomerMatch({ phone: a.phone, email: a.email, byPhone: a, byEmail: a })).toEqual({
      action: "attach",
      customerId: "a",
      contactMismatch: false,
    });
  });

  it("attaches to the phone match and flags when the email belongs to someone else", () => {
    expect(decideCustomerMatch({ phone: a.phone, email: b.email, byPhone: a, byEmail: b })).toEqual({
      action: "attach",
      customerId: "a",
      contactMismatch: true,
    });
  });

  it("flags a known phone entered with a new email", () => {
    expect(decideCustomerMatch({ phone: a.phone, email: "other@x.sa", byPhone: a, byEmail: null })).toEqual({
      action: "attach",
      customerId: "a",
      contactMismatch: true,
    });
  });

  it("attaches to the email match and flags when the phone is new", () => {
    expect(decideCustomerMatch({ phone: "+966500000009", email: b.email, byPhone: null, byEmail: b })).toEqual({
      action: "attach",
      customerId: "b",
      contactMismatch: true,
    });
  });
});
