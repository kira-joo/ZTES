/**
 * An in-memory stand-in for `next/headers` cookies(), so route handlers that
 * write cookies can run under vitest. `vi.mock("next/headers", …)` in the test
 * file points at `cookieJar`.
 */
export const cookieJar = (() => {
  const values = new Map<string, { value: string; options?: Record<string, unknown> }>();
  return {
    values,
    get: (name: string) => (values.has(name) ? { name, value: values.get(name)!.value } : undefined),
    getAll: () => [...values.entries()].map(([name, entry]) => ({ name, value: entry.value })),
    has: (name: string) => values.has(name),
    set: (name: string | { name: string; value: string }, value?: string, options?: Record<string, unknown>) => {
      if (typeof name === "object") values.set(name.name, { value: name.value, options: name as Record<string, unknown> });
      else if (value === "" || options?.maxAge === 0) values.delete(name);
      else values.set(name, { value: value!, options });
    },
    delete: (name: string) => values.delete(name),
    clear: () => values.clear(),
    header: () => [...values.entries()].map(([name, entry]) => `${name}=${entry.value}`).join("; "),
  };
})();


export const mockHeadersModule = {
  cookies: async () => cookieJar,
  headers: async () => new Headers(),
};
