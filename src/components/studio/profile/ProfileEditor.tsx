"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { IoCheckmarkCircle, IoClose } from "react-icons/io5";
import { USERNAME_PATTERN } from "@/lib/auth";
import { creatorHref } from "@/lib/format";
import { deleteStoredImage } from "@/lib/imageStore";
import { SOCIAL_PLATFORMS, useMockCreator, type CreatorProfile, type SocialPlatform } from "@/lib/mockCreator";
import { MAX_GENRES, type StudioMode } from "@/lib/studioModel";
import { genreTag } from "@/lib/tagStyles";
import { GenreSelect } from "../comics/GenreSelect";
import { ImageDrop } from "../comics/ImageDrop";
import { DesktopOnly } from "../StudioGate";
import { StudioImage } from "../StudioImage";

const PLATFORM: Record<SocialPlatform, { label: string; icon: IconType; url: (h: string) => string }> = {
  instagram: { label: "Instagram", icon: FaInstagram, url: (h) => `https://www.instagram.com/${h}/` },
  x: { label: "X", icon: FaXTwitter, url: (h) => `https://x.com/${h}` },
  tiktok: { label: "TikTok", icon: FaTiktok, url: (h) => `https://www.tiktok.com/@${h}` },
  youtube: { label: "YouTube", icon: FaYoutube, url: (h) => `https://www.youtube.com/@${h}` },
  facebook: { label: "Facebook", icon: FaFacebookF, url: (h) => `https://www.facebook.com/${h}` },
};

const TAGLINE_MAX = 80;
const BIO_MAX = 500;

// People paste whole links or "@handle"; keep just the handle.
const cleanHandle = (raw: string) =>
  raw
    .trim()
    .replace(/^https?:\/\/(www\.)?[^/]+\/(@)?/i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");

type Props = {
  mode: StudioMode;
  // The established demo starts from its real public profile.
  seed: CreatorProfile | null;
  genres: string[];
};

export function ProfileEditor({ mode, seed, genres }: Props) {
  const store = useMockCreator(mode === "established" ? "tc-mock-creator-established" : undefined);
  const profile = store.profile ?? seed;
  if (!profile) return null;
  // Keyed by account, not content: saving must not rebuild the form (that would wipe "Saved").
  return <ProfileForm key={mode} profile={profile} genres={genres} onSave={store.become} />;
}

function ProfileForm({ profile, genres, onSave }: { profile: CreatorProfile; genres: string[]; onSave: (p: CreatorProfile) => void }) {
  const [draft, setDraft] = useState<CreatorProfile>({
    tagline: "",
    avatar: null,
    banner: null,
    genres: [],
    socials: [],
    ...profile,
  });
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [socialInput, setSocialInput] = useState("");
  const set = <K extends keyof CreatorProfile>(key: K, value: CreatorProfile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  // Images swapped out in this edit are deleted from the browser's storage once the change is saved.
  const [discarded, setDiscarded] = useState<string[]>([]);
  const swapImage = (key: "avatar" | "banner", next: string | null) => {
    const current = draft[key];
    if (current && current !== profile[key]) deleteStoredImage(current);
    else if (current) setDiscarded((d) => [...d, current]);
    set(key, next);
  };

  const errors = {
    name: !draft.name.trim() ? "Enter the name readers will see." : null,
    handle: !USERNAME_PATTERN.test(draft.handle) ? "3–20 letters, numbers or underscores." : null,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.name || errors.handle) return;
    discarded.forEach((ref) => deleteStoredImage(ref));
    setDiscarded([]);
    onSave({ ...draft, name: draft.name.trim(), tagline: draft.tagline?.trim(), bio: draft.bio.trim() });
    setSaved(true);
  };

  const addSocial = () => {
    const handle = cleanHandle(socialInput);
    if (!handle) return;
    const rest = (draft.socials ?? []).filter((s) => s.platform !== platform);
    set("socials", [...rest, { platform, handle }]);
    setSocialInput("");
  };

  const input = "w-full border-2 bg-ink px-3 text-base text-white outline-none focus:border-mint";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">Profile</h1>
          <p className="mt-2 text-sm text-slate-400">How readers see you on your creator page.</p>
        </div>
        <Link href={creatorHref(profile.handle)} className="text-sm font-semibold text-mint hover:underline">View public page →</Link>
      </div>

      <section aria-label="Preview" className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
        <ProfilePreview profile={draft} />
      </section>

      <div className="mt-10">
        <DesktopOnly what="edit your profile">
          <form onSubmit={submit} noValidate className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="grid content-start gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-200">Display name</span>
                  <input value={draft.name} onChange={(e) => set("name", e.target.value)} className={`${input} h-11 ${submitted && errors.name ? "border-sun" : "border-line"}`} />
                  {submitted && errors.name && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.name}</span>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-200">Handle</span>
                  <input
                    value={draft.handle}
                    spellCheck={false}
                    onChange={(e) => set("handle", e.target.value)}
                    className={`${input} h-11 ${submitted && errors.handle ? "border-sun" : "border-line"}`}
                  />
                  <span className={`mt-1.5 block text-xs ${submitted && errors.handle ? "font-semibold text-sun" : "text-slate-500"}`}>
                    {submitted && errors.handle ? errors.handle : `Your page: ${creatorHref(draft.handle || "you")}`}
                  </span>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
                  Tagline <span className="font-normal text-slate-500">{draft.tagline?.length ?? 0}/{TAGLINE_MAX}</span>
                </span>
                <input
                  value={draft.tagline ?? ""}
                  maxLength={TAGLINE_MAX}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="One line under your name, e.g. “Afrofuturist Mafiki from Lagos”"
                  className={`${input} h-11 border-line placeholder:text-slate-600`}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
                  Bio <span className="font-normal text-slate-500">{draft.bio.length}/{BIO_MAX}</span>
                </span>
                <textarea
                  value={draft.bio}
                  maxLength={BIO_MAX}
                  rows={4}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Who you are, what you make, where readers can find more."
                  className={`${input} border-line py-2.5 placeholder:text-slate-600`}
                />
              </label>

              <div>
                <p className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
                  Genres you make <span className="font-normal text-slate-500">{draft.genres?.length ?? 0}/{MAX_GENRES}</span>
                </p>
                <GenreSelect options={genres} value={draft.genres ?? []} onChange={(g) => set("genres", g)} max={MAX_GENRES} />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-semibold text-slate-200">Social links</p>
                <div className="flex max-w-xl">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                    aria-label="Platform"
                    className="h-11 shrink-0 border-2 border-r-0 border-line bg-panel px-2 text-sm font-semibold text-white outline-none focus:border-mint"
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{PLATFORM[p].label}</option>
                    ))}
                  </select>
                  <input
                    value={socialInput}
                    onChange={(e) => setSocialInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSocial();
                      }
                    }}
                    placeholder="@handle or link"
                    aria-label="Handle or link"
                    className={`${input} h-11 border-line placeholder:text-slate-600`}
                  />
                  <button type="button" onClick={addSocial} className="h-11 shrink-0 border-2 border-l-0 border-line px-4 text-sm font-bold text-mint hover:bg-panel">
                    Add
                  </button>
                </div>
                {(draft.socials?.length ?? 0) > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {draft.socials!.map(({ platform: p, handle }) => {
                      const { icon: Icon, label } = PLATFORM[p];
                      return (
                        <li key={p} className="flex items-center gap-2 border-2 border-line bg-panel py-1 pl-2.5 pr-1 text-sm text-slate-200">
                          <Icon className="text-mint" aria-label={label} /> @{handle}
                          <button
                            type="button"
                            onClick={() => set("socials", draft.socials!.filter((s) => s.platform !== p))}
                            aria-label={`Remove ${label}`}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <IoClose />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-1.5 text-xs text-slate-500">One per platform. Adding another replaces it.</p>
              </div>

              <ImageDrop
                label="Banner"
                hint="Wide image across the top of your page. 1600px+ wide works best."
                value={draft.banner ?? null}
                onChange={(ref) => swapImage("banner", ref)}
                aspect="aspect-[16/5]"
                maxWidth={1600}
              />

              <div className="flex flex-wrap items-center gap-4 border-t-2 border-line pt-6">
                <button type="submit" className="btn btn-primary px-6 py-3 text-base">Save profile</button>
                {saved && (
                  <span role="status" className="flex items-center gap-1.5 text-sm font-semibold text-mint">
                    <IoCheckmarkCircle /> Saved
                  </span>
                )}
              </div>
            </div>

            <div>
              <ImageDrop
                label="Avatar"
                hint="Square. Shown as a small square on shorts and comments."
                value={draft.avatar ?? null}
                onChange={(ref) => swapImage("avatar", ref)}
                aspect="aspect-square"
                maxWidth={400}
              />
            </div>
          </form>
        </DesktopOnly>
      </div>
    </>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";

// The top of the public creator page, built from the draft so edits show as you type.
function ProfilePreview({ profile }: { profile: CreatorProfile }) {
  const mainGenre = profile.genres?.[0];
  return (
    <div className="relative overflow-hidden border-2 border-line">
      <div className="absolute inset-0" aria-hidden="true">
        {profile.banner ? (
          <>
            <StudioImage src={profile.banner} width={1600} className="h-full w-full opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
          </>
        ) : (
          <div className="dot-field h-full w-full opacity-40" />
        )}
      </div>
      <div className="relative flex flex-col gap-5 px-5 pb-6 pt-16 sm:flex-row sm:items-end sm:px-8">
        {profile.avatar ? (
          <StudioImage src={profile.avatar} width={300} className="h-24 w-24 shrink-0 border-[3px] border-black shadow-[4px_4px_0_#000] sm:h-28 sm:w-28" />
        ) : (
          <span
            className={`flex h-24 w-24 shrink-0 items-center justify-center border-[3px] border-black font-display text-4xl text-ink shadow-[4px_4px_0_#000] sm:h-28 sm:w-28 ${mainGenre ? genreTag(mainGenre) : "bg-sun"}`}
          >
            {initials(profile.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="break-words font-display text-4xl uppercase leading-[0.9] text-white sm:text-5xl">{profile.name || "Your name"}</p>
          <p className="mt-1.5 text-sm text-slate-400">@{profile.handle}</p>
          {profile.tagline && <p className="mt-2 text-sm font-semibold text-slate-200">{profile.tagline}</p>}
          {profile.bio && <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {profile.genres?.map((g) => (
              <span key={g} className={`tag ${genreTag(g)}`}>{g}</span>
            ))}
            {profile.socials?.map(({ platform, handle }) => {
              const { icon: Icon, label, url } = PLATFORM[platform];
              return (
                <a key={platform} href={url(handle)} target="_blank" rel="noopener noreferrer" aria-label={`${label}: @${handle}`} className="flex h-8 w-8 items-center justify-center border-2 border-line text-slate-200 hover:border-mint hover:text-white">
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
