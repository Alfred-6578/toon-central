import { isLive } from "./config";
import { apiRequest, isEmpty } from "./http";
import { apiAsUser } from "./token";

// Phase 3: what a signed-in reader does (likes, library, follows, comments). Server-only; the
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

// Shorts are commented on by uuid, comics by their number id (the uuid gives a 500) and episodes by
// the episode id. All three answer in the same shape, newest first, and anyone can read them.
export type CommentTarget = "short" | "comic" | "episode";

const COMMENT_ROUTES: Record<CommentTarget, { list: string; add: string; key: string }> = {
  short: { list: "short-comments", add: "add-comment", key: "shortComments" },
  comic: { list: "comments", add: "add-comment", key: "comicComments" },
  episode: { list: "episode-comments", add: "add-episode-comment", key: "comicCatalogComments" },
};

const validCommentKey = (target: CommentTarget, key: string) =>
  target === "short" ? UUID.test(key) : /^[1-9]\d{0,9}$/.test(key);

export async function getComments(target: CommentTarget, key: string, page = 1): Promise<CommentPage | null> {
  const route = COMMENT_ROUTES[target];
  if (!live() || !route || !validCommentKey(target, key)) return null;
  const result = await apiRequest<Record<string, unknown> | null>(
    `/${route.list}/${key}?page=${Math.max(1, Math.floor(page))}&limit=20`,
    { revalidate: false }
  );
  if (isEmpty(result)) return { comments: [], total: 0, totalPages: 0 };
  if (!result.ok) return null;
  const rows = result.data?.[route.key];
  const pagination = (result.data?.pagination ?? {}) as { total?: number; totalPages?: number };
  return {
    comments: (Array.isArray(rows) ? (rows as Raw[]) : []).map(toPublicComment),
    total: pagination.total ?? 0,
    totalPages: pagination.totalPages ?? 1,
  };
}

export const COMMENT_MAX = 300;

export async function addComment(target: CommentTarget, key: string, text: string): Promise<ActionResult> {
  const route = COMMENT_ROUTES[target];
  const comment = text.trim().slice(0, COMMENT_MAX);
  if (!live() || !route || !validCommentKey(target, key) || !comment) return failed();
  const result = await apiAsUser(`/${route.list}/${key}/${route.add}`, { method: "POST", body: { comment } });
  if (result.ok) return { ok: true, value: true };
  return result.status === 401 ? failed("Sign in to comment.") : failed("Your comment didn't post. Please try again.");
}
