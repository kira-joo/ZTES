/**
 * Decides which customer a guest order belongs to. Pure; the placement
 * transaction supplies the two lookups.
 *
 * - No match → create a customer.
 * - Matched → attach. Only the name and last address are refreshed; a stored
 *   phone or email is never overwritten from unauthenticated input.
 * - Phone matches one customer while the email belongs to another → attach to
 *   the phone match (phone is how a COD order is delivered) and flag it.
 *
 * Checkout never fails on identity, and the result never tells the caller
 * which other customers exist.
 */
export interface CustomerRef {
  id: string;
  phone: string;
  email: string;
}

export type CustomerMatchDecision =
  | { action: "create" }
  | { action: "attach"; customerId: string; contactMismatch: boolean };

export function decideCustomerMatch(input: {
  phone: string;
  email: string;
  byPhone: CustomerRef | null;
  byEmail: CustomerRef | null;
}): CustomerMatchDecision {
  const { byPhone, byEmail } = input;

  if (byPhone) {
    const mismatch = byPhone.email !== input.email;
    return { action: "attach", customerId: byPhone.id, contactMismatch: mismatch };
  }

  if (byEmail) {
    // Same person on a new number, or two people sharing an email. Either way
    // the stored phone stays; the order keeps the number that was entered.
    return { action: "attach", customerId: byEmail.id, contactMismatch: true };
  }

  return { action: "create" };
}
