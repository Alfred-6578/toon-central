import type { MockUser } from "@/lib/mockSession";
import { isLive } from "./config";
import { apiRequest } from "./http";
import { clearAccessToken, getAccessToken, saveAccessToken } from "./token";

// Accounts (Phase 2 area "accounts"): sign in, join, password reset and the signed-in reader's profile.
// Server-only. The access token never reaches the browser; it lives in the httpOnly cookie (token.ts).

type Raw = Record<string, unknown>;

// The signed-in reader, in the shape the site's components already use (the mock user's).
export type SessionUser = MockUser;

export type AccountResult =
  | { ok: true; message?: string }
  // `unverified`: the account exists but its email hasn't been confirmed, so offer to resend the link.
  | { ok: false; message: string; unverified?: boolean };

const str = (v: unknown) => (typeof v === "string" ? v : "");

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";

export function toSessionUser(raw: Raw): SessionUser {
  const name = [str(raw.firstName), str(raw.lastName)].filter(Boolean).join(" ") || str(raw.username);
  const wallet = (raw.wallet ?? {}) as Raw;
  return {
    name,
    username: str(raw.username),
    initials: initialsOf(name),
    bio: str(raw.welcomeNote),
    email: str(raw.email),
    joined: str(raw.createdAt).slice(0, 10),
    // Plan details arrive with Phase 4 (money); any plan on the account counts as Premium for now.
    plan: { tier: raw.userSubscriptionPlan ? "Premium" : "Free", renews: null },
    credits: Number(wallet.coinBalance) || 0,
    // No follower count or referral names in the profile yet.
    followers: 0,
    referrals: [],
    photo: str(raw.photo) || null,
  };
}

// Seconds until the token's own expiry (it's a JWT; the backend issues them for about 92 days).
function tokenLifetime(token: string) {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    const seconds = Math.floor(exp - Date.now() / 1000);
    if (seconds > 0) return seconds;
  } catch {
    // Not a JWT we can read: fall back below.
  }
  return 30 * 24 * 60 * 60;
}

// The backend's messages, reworded where they'd tell a stranger whether an email has an account.
function friendly(message: string) {
  if (/does not exist/i.test(message)) return "That email and password don't match an account.";
  return message;
}

const NOT_LIVE: AccountResult = { ok: false, message: "Accounts aren't connected yet." };

export async function signIn(email: string, password: string): Promise<AccountResult> {
  if (!isLive("accounts")) return NOT_LIVE;
  const result = await apiRequest<{ accessToken?: string }>("/onboard/login", { method: "POST", body: { email, password }, revalidate: false });
  if (!result.ok) return { ok: false, message: friendly(result.message), unverified: /verify your email/i.test(result.message) };
  const token = result.data.accessToken;
  if (!token) return { ok: false, message: "Signing in didn't work. Please try again." };
  await saveAccessToken(token, tokenLifetime(token));
  return { ok: true };
}

export type SignUpFields = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  mobileOperatorId: number;
  password: string;
};

// Every reader joins from Nigeria for now (the only country with mobile operators listed).
const NIGERIA = 1;

export async function signUp(fields: SignUpFields): Promise<AccountResult> {
  if (!isLive("accounts")) return NOT_LIVE;
  const result = await apiRequest("/onboard/register", {
    method: "POST",
    body: { ...fields, confirmedPassword: fields.password, countryId: NIGERIA, acceptedTerms: true },
    revalidate: false,
  });
  // The response also carries the verification code; it's deliberately dropped here (backend issue).
  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

export async function resendVerification(email: string): Promise<AccountResult> {
  if (!isLive("accounts")) return NOT_LIVE;
  const result = await apiRequest(`/onboard/resend-verification-code?email=${encodeURIComponent(email)}`, { revalidate: false });
  return result.ok ? { ok: true } : { ok: false, message: friendly(result.message) };
}

// Always reports success for an unknown email, so the form can't be used to find out who has an account.
export async function forgotPassword(email: string): Promise<AccountResult> {
  if (!isLive("accounts")) return NOT_LIVE;
  const result = await apiRequest("/onboard/forgot-password", { method: "POST", body: { email }, revalidate: false });
  if (result.ok || /does not exist/i.test(result.message)) return { ok: true };
  return { ok: false, message: result.message };
}

// The reader this request belongs to, or null when signed out (or the token stopped working).
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isLive("accounts")) return null;
  const token = await getAccessToken();
  if (!token) return null;
  const result = await apiRequest<Raw>("/profile", { token });
  return result.ok ? toSessionUser(result.data) : null;
}

// There's no sign-out endpoint, so the token stays valid on the backend until it expires; we forget it.
export async function signOut() {
  await clearAccessToken();
}

export type MobileOperator = { id: number; name: string };

// Shown when the list can't be fetched (same ids as the backend's list, checked 3 Nov 2026).
const OPERATORS_FALLBACK: MobileOperator[] = [
  { id: 1, name: "MTN" },
  { id: 2, name: "Glo" },
  { id: 3, name: "Airtel" },
  { id: 4, name: "9mobile" },
];

// For the join form, MTN first (Toon Central's billing partner). The backend's names end in " NG".
export async function getMobileOperators(): Promise<MobileOperator[]> {
  if (!isLive("accounts")) return OPERATORS_FALLBACK;
  const result = await apiRequest<Raw[]>("/selectables/mobile-operators", { revalidate: 86_400 });
  if (!result.ok || !Array.isArray(result.data) || !result.data.length) return OPERATORS_FALLBACK;
  return result.data
    .map((op) => ({ id: Number(op.id), name: str(op.name).replace(/\s+NG$/i, "").replace(/^T-Mobile$/i, "9mobile") }))
    .sort((a, b) => Number(b.name === "MTN") - Number(a.name === "MTN"));
}
