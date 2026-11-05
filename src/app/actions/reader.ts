"use server";

import * as reader from "@/lib/api/readerActions";

// The browser's way into the reader actions (src/lib/api/readerActions.ts). Each one runs as the
// signed-in reader, using the token in their httpOnly cookie, and fails quietly when signed out.

const uuid = (value: unknown) => (typeof value === "string" ? value : "");

export async function readerListsAction() {
  return reader.getReaderLists();
}

export async function setLikeAction(kind: "comics" | "shorts", id: string, liked: boolean) {
  return reader.setLike(kind === "shorts" ? "shorts" : "comics", uuid(id), liked === true);
}

export async function addToFavouritesAction(id: string) {
  return reader.addToFavourites(uuid(id));
}

export async function setFollowAction(creatorId: number, follow: boolean) {
  return reader.setFollow(Number(creatorId), follow === true);
}

export async function followStatusAction(creatorId: number) {
  return reader.getFollowStatus(Number(creatorId));
}

const target = (value: unknown): reader.CommentTarget => (value === "comic" || value === "episode" ? value : "short");

export async function commentsAction(kind: reader.CommentTarget, key: string, page: number) {
  return reader.getComments(target(kind), String(key), Number(page) || 1);
}

export async function addCommentAction(kind: reader.CommentTarget, key: string, text: string) {
  return reader.addComment(target(kind), String(key), typeof text === "string" ? text : "");
}
