import { isLive } from "./config";
import { apiRequest, isEmpty } from "./http";
import { apiAsUser } from "./token";

// Phase 3: what a signed-in reader does (likes, library, follows, short comments). Server-only; the
// browser reaches these through src/app/actions/reader.ts. Behaviour checked on staging (3 Nov 2026):
// - comics/:uuid/like and shorts/:uuid/like toggle, and say which way in the message ("liked" /
//   "unliked"), so asking for a state can take a second call when the page's idea of it was stale.
// - comics/:uuid/add-to-favourite only adds; there is no way to take a comic back out.
// - profile/:id/follow and /unfollow are separate and safe to repeat; check-follow-status answers true/false.
// - comics/:uuid/subscribe fails (500) and comics/subscribed lists every reader's subscriptions, so
//   subscribing stays in the browser for now.

type Raw = Record<string, unknown>;

export type ActionResult<T = true> = { ok: true; value: T } | { ok: false; message: string };

const UUID = /^[0-9a-f-]{36}$/i;
const failed = (message = "That didn't go through. Please try again.") => ({ ok: false as const, message });

const live = () => isLive("readerActions") && isLive("accounts");

// The reader's liked comics and saved (favourite) comics, as uuids.
export async function getReaderLists(): Promise<{ likedComics: string[]; favourites: string[] } | null> {
  if (!live()) return null;
  const [likes, favourites] = await Promise.all([
    apiAsUser<Raw[]>("/user-likes"),
    // An empty library comes back as status: true with data: null.
    apiAsUser<{ comics?: Raw[] } | null>("/comics/favourites?page=1&limit=500"),
  ]);
  // No likes yet is a 404 ("no likes found"); no favourites is the usual "no record found".
  const noLikes = !likes.ok && /no likes/i.test(likes.message);
  if ((!likes.ok && !noLikes) || (!favourites.ok && !isEmpty(favourites))) return null;
  const uuidOf = (row: Raw) => String((row.comic as Raw | undefined)?.uuid ?? "");
  return {
    likedComics: likes.ok && Array.isArray(likes.data) ? likes.data.map(uuidOf).filter(Boolean) : [],
    favourites: favourites.ok ? (favourites.data?.comics ?? []).map(uuidOf).filter(Boolean) : [],
  };
}

// Likes a comic or short (or takes the like back) and returns the state the backend ended in.
export async function setLike(kind: "comics" | "shorts", uuid: string, liked: boolean): Promise<ActionResult<boolean>> {
  if (!live() || !UUID.test(uuid)) return failed();
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await apiAsUser(`/${kind}/${uuid}/like`);
    if (!result.ok) return failed();
    const now = !/unliked/i.test(result.message);
    if (now === liked) return { ok: true, value: now };
  }
  return failed();
}

export async function addToFavourites(uuid: string): Promise<ActionResult> {
  if (!live() || !UUID.test(uuid)) return failed();
  const result = await apiAsUser(`/comics/${uuid}/add-to-favourite`);
  return result.ok ? { ok: true, value: true } : failed();
}

export async function setFollow(creatorId: number, follow: boolean): Promise<ActionResult<boolean>> {
  if (!live() || !Number.isInteger(creatorId) || creatorId <= 0) return failed();
  const result = await apiAsUser(`/profile/${creatorId}/${follow ? "follow" : "unfollow"}`);
  return result.ok ? { ok: true, value: follow } : failed();
}

export async function getFollowStatus(creatorId: number): Promise<boolean | null> {
  if (!live() || !Number.isInteger(creatorId) || creatorId <= 0) return null;
  const result = await apiAsUser<boolean>(`/profile/${creatorId}/check-follow-status`);
  return result.ok ? result.data === true : null;
}

export type PublicComment = { id: number; text: string; at: string; user: { username: string; photo: string | null } };
export type CommentPage = { comments: PublicComment[]; total: number; totalPages: number };

// Each comment comes with the commenter's whole account (email, phone, date of birth), so only the
// name and photo are passed on.
function toPublicComment(raw: Raw): PublicComment {
  const user = (raw.user ?? {}) as Raw;
  return {
    id: Number(raw.id) || 0,
    text: String(raw.comment ?? ""),
    at: String(raw.createdAt ?? ""),
    user: { username: String(user.username ?? "Reader"), photo: typeof user.photo === "string" ? user.photo : null },
  };
}

// Comments on a short, newest first. Public: anyone can read them.
export async function getShortComments(uuid: string, page = 1): Promise<CommentPage | null> {
  if (!live() || !UUID.test(uuid)) return null;
  const result = await apiRequest<{ shortComments?: Raw[]; pagination?: { total?: number; totalPages?: number } } | null>(
    `/short-comments/${uuid}?page=${Math.max(1, Math.floor(page))}&limit=20`,
    { revalidate: false }
  );
  if (isEmpty(result)) return { comments: [], total: 0, totalPages: 0 };
  if (!result.ok) return null;
  return {
    comments: (result.data?.shortComments ?? []).map(toPublicComment),
    total: result.data?.pagination?.total ?? 0,
    totalPages: result.data?.pagination?.totalPages ?? 1,
  };
}

export const COMMENT_MAX = 300;

export async function addShortComment(uuid: string, text: string): Promise<ActionResult> {
  const comment = text.trim().slice(0, COMMENT_MAX);
  if (!live() || !UUID.test(uuid) || !comment) return failed();
  const result = await apiAsUser(`/short-comments/${uuid}/add-comment`, { method: "POST", body: { comment } });
  if (result.ok) return { ok: true, value: true };
  return result.status === 401 ? failed("Sign in to comment.") : failed("Your comment didn't post. Please try again.");
}
