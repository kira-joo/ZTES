// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlaceOrder } from "./use-cart";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const BODY = {
  contact: { firstName: "سارة", lastName: "أحمد", phone: "+966512345678", email: "sara@example.com" },
  address: { district: "d", street: "s" },
  safeUseAccepted: true,
  paymentMethod: "CASH_ON_DELIVERY" as const,
  locale: "ar" as const,
};

describe("usePlaceOrder", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("reuses the same Idempotency-Key across a retry of the same submit", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { message: "transient" })).mockResolvedValueOnce(jsonResponse(201, { orderNumber: "250101-0001" }));

    const { result } = renderHook(() => usePlaceOrder(), { wrapper });

    await act(async () => {
      await result.current.placeOrder(BODY).catch(() => undefined);
    });
    await act(async () => {
      await result.current.placeOrder(BODY);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstHeaders = fetchMock.mock.calls[0]![1].headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1]![1].headers as Record<string, string>;
    expect(firstHeaders["Idempotency-Key"]).toBeTruthy();
    expect(firstHeaders["Idempotency-Key"]).toBe(secondHeaders["Idempotency-Key"]);
  });

  it("generates a fresh key after resetAttempt (a genuinely new submit)", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async () => jsonResponse(201, { orderNumber: "250101-0001" }));

    const { result } = renderHook(() => usePlaceOrder(), { wrapper });

    await act(async () => {
      await result.current.placeOrder(BODY);
    });
    act(() => result.current.resetAttempt());
    await act(async () => {
      await result.current.placeOrder(BODY);
    });

    const firstHeaders = fetchMock.mock.calls[0]![1].headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1]![1].headers as Record<string, string>;
    expect(firstHeaders["Idempotency-Key"]).not.toBe(secondHeaders["Idempotency-Key"]);
  });
});
