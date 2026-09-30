"use client";

import { adminLoginEndpoint, adminRefreshEndpoint } from "api/admin-auth.endpoints";
import { getDefaultApiClient, toAppError } from "@kira-joo/frontend-toolkit-core";
import { AlertTriangle, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

export const dynamic = "force-dynamic";

/** Only a same-site path is followed — a `next` naming an external origin is an open redirect. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin/dashboard";
}

/** `useSearchParams` requires a Suspense boundary above it even on a `force-dynamic` page. */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<CheckingSession />}>
      <LoginForm />
    </Suspense>
  );
}

function CheckingSession() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc]">
      <span className="sr-only">Checking your session…</span>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // A session that is merely expired (not absent) should not need re-typing a
  // password — the proxy sends expired sessions here, so try a silent refresh
  // first and only show the form once that has failed.
  useEffect(() => {
    let cancelled = false;
    getDefaultApiClient()
      .request(adminRefreshEndpoint, { skipAuthRefresh: true })
      .then(() => {
        if (!cancelled) router.replace(next);
      })
      .catch(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // A wrong password is an ordinary, expected 401 — not a session that
      // expired mid-use — so it skips the refresh-and-retry dance entirely.
      await getDefaultApiClient().request(adminLoginEndpoint, { body: { password }, skipAuthRefresh: true });
      router.replace(next);
      router.refresh();
    } catch (caught) {
      // `requester` throws an already-normalized `ApiError`, never a raw
      // `Response` — `toAppError` (not `normalizeApiError`, which assumes the
      // opposite and mislabels this "Network error") reads it directly.
      setError((await toAppError(caught)).message);
      setIsSubmitting(false);
    }
  };

  if (checkingSession) return <CheckingSession />;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Lock className="size-5 text-slate-700" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ZTES Admin</h1>
        </div>
        <p className="text-sm text-slate-500">Sign in to manage the store.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 rounded-md border border-slate-300 px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb]"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || password.length === 0}
            className="min-h-11 rounded-md bg-slate-900 px-4 font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
