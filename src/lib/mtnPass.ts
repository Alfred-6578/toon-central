"use client";

import { useSyncExternalStore } from "react";
import { parsePass, PASS_COOKIE, type Pass } from "@/lib/session";

// The MTN Daily pass, as the demo keeps it: in a cookie the reader page (server) reads.
export const MTN_DAILY_PRICE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const readRaw = () => document.cookie.split("; ").find((c) => c.startsWith(`${PASS_COOKIE}=`))?.slice(PASS_COOKIE.length + 1) ?? "";

export function usePass(): Pass | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  return parsePass(raw);
}

export function activatePass(msisdn: string) {
  write({ msisdn, until: Date.now() + DAY_MS, renews: true });
}

function write(pass: Pass) {
  const maxAge = Math.max(0, Math.round((pass.until - Date.now()) / 1000));
  document.cookie = `${PASS_COOKIE}=${encodeURIComponent(JSON.stringify(pass))}; path=/; max-age=${maxAge}; samesite=lax`;
  listeners.forEach((l) => l());
}

// Stops the daily renewal; the day already paid for stays open.
export function cancelPass(pass: Pass) {
  write({ ...pass, renews: false });
}

// Nigerian MTN prefixes (after the leading 0). A number from another network can't be billed by MTN.
const MTN_PREFIXES = ["703", "704", "706", "803", "806", "810", "813", "814", "816", "903", "906", "913", "916", "7025", "7026"];

// "08031234567", "+234 803 123 4567", "2348031234567" → "08031234567"; anything else → null.
export function normaliseNigerianNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("234") ? `0${digits.slice(3)}` : digits;
  return /^0\d{10}$/.test(local) ? local : null;
}

export const isMtnNumber = (local: string) => MTN_PREFIXES.some((p) => local.slice(1).startsWith(p));
export const maskNumber = (local: string) => `${local.slice(0, 4)}••••${local.slice(-3)}`;
