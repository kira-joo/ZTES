/**
 * Throwing accessors for required configuration. A missing value is a boot
 * failure, never a 500 on whichever request happens to need it first.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  return value;
}

/** A signing secret. `jose` would otherwise sign with a short key, which "works" and is forgeable. */
export function requireSecret(name: string, minLength = 32): string {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(
      `${name} must be set to at least ${minLength} characters. Generate one with: openssl rand -base64 48`
    );
  }
  return value;
}

/** Parses `15m`, `12h`, `7d`, or a bare number of seconds into milliseconds. */
export function readDurationMs(name: string, fallback: string): number {
  const raw = (process.env[name] ?? fallback).trim();
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(raw);
  if (!match) throw new Error(`${name} must look like 15m, 12h, 7d or a number of seconds (got "${raw}").`);
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const factor = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
  return amount * factor;
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3030").replace(/\/+$/, "");
}
