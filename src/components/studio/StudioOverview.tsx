"use client";

import Link from "next/link";
import { IoAdd, IoArrowForward, IoCheckmark, IoEyeOutline, IoHeartOutline, IoPeopleOutline, IoSchoolOutline, IoWalletOutline } from "react-icons/io5";
import type { IconType } from "react-icons";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import type { Comic, Short } from "@/lib/api/types";
import { cloudinary, comicCount, comicHref, creatorHref, formatCount, timeAgo } from "@/lib/format";
import { useMockCreator } from "@/lib/mockCreator";
import { useHydrated, useMockSession } from "@/lib/mockSession";
import { studioPage, type StudioDemo } from "@/lib/studio";
import { useStudioComics, useStudioShorts } from "@/lib/studioStore";
import { BecomeCreator } from "./BecomeCreator";

// Who can see the Studio: signed out → sign in; signed in but not a creator → the one-step setup;
// creators (or the "established" demo) → the Overview.
export function StudioOverviewGate({ demo }: { demo: StudioDemo | null }) {
  const hydrated = useHydrated();
  const { user } = useMockSession();
  const { profile } = useMockCreator();

  if (!hydrated) return <div className="min-h-[50vh]" />;
  if (!user) {
    return (
      <SignInPrompt
        title="Creator Studio"
        body="Sign in to publish your comics and shorts and see how readers respond."
        next="/creator/dashboard"
      />
    );
  }
  if (demo) return <Overview name={demo.name} handle={demo.handle} comics={demo.comics} shorts={demo.shorts} sample={demo.sample} />;
  if (!profile) return <BecomeCreator />;
  return <Overview name={profile.name} handle={profile.handle} comics={[]} shorts={[]} sample={null} />;
}

function SampleStamp() {
  return (
    <span className="border border-dashed border-current px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide opacity-70">Sample</span>
  );
}

type OverviewProps = {
  name: string;
  handle: string;
  comics: Comic[];
  shorts: Short[];
  sample: StudioDemo["sample"] | null;
};

function Overview({ name, handle, comics, shorts, sample }: OverviewProps) {
  const reads = comics.reduce((sum, c) => sum + c.views, 0);
  const likes = comics.reduce((sum, c) => sum + c.likes, 0) + shorts.reduce((sum, s) => sum + s.likes, 0);
  const isNew = comics.length === 0 && shorts.length === 0;
  const topComic = [...comics].sort((a, b) => b.views - a.views)[0];
  const topShort = [...shorts].sort((a, b) => b.views - a.views)[0];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Overview</p>
          <h1 className="mt-1 break-words font-display text-4xl uppercase leading-[0.9] text-white sm:text-6xl">Welcome, {name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            @{handle} ·{" "}
            {isNew ? (
              "Your public page goes live with your first comic or short"
            ) : (
              <Link href={creatorHref(handle)} className="text-slate-300 underline-offset-4 hover:text-mint hover:underline">
                View your public page
              </Link>
            )}
          </p>
        </div>
        {/* Publishing is desktop-only; phones can still check how things are going. */}
        <div className="hidden gap-3 lg:flex">
          <StudioAction pageId="shorts" label="Upload short" ghost />
          <StudioAction pageId="comics" label="New comic" />
        </div>
        <p className="w-full border-2 border-dashed border-line px-4 py-3 text-xs text-slate-400 lg:hidden">
          Open Studio on a computer to publish or edit. Your stats are all here.
        </p>
      </div>

      {isNew && <Checklist />}

      <Link
        href="/creator101"
        className="group mt-6 flex items-center gap-4 border-2 border-line bg-panel px-4 py-3 transition-colors hover:border-mint"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-sun text-xl text-ink">
          <IoSchoolOutline />
        </span>
        <span className="min-w-0 flex-1 text-sm text-slate-300">
          <span className="block font-semibold text-white">{isNew ? "New to publishing? Start with Creator 101" : "Creator 101: the creator guide"}</span>
          Uploading tips, the Mafiki format, and how creators make money.
        </span>
        <IoArrowForward className="shrink-0 text-lg text-slate-400 group-hover:text-mint" />
      </Link>

      <ul className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={IoEyeOutline} label="Total reads" value={formatCount(reads)} />
        <Stat icon={IoHeartOutline} label="Total likes" value={formatCount(likes)} />
        <Stat icon={IoPeopleOutline} label="Followers" value={sample ? formatCount(sample.followers) : "0"} sample={!!sample} />
        <Stat
          icon={IoWalletOutline}
          label="Earnings"
          value={sample ? `₦${sample.earningsNaira.toLocaleString("en-NG")}` : "₦0"}
          sample={!!sample}
        />
      </ul>

      <ReadsChart daily={sample?.dailyReads ?? null} />

      {!isNew && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {topComic && (
            <Highlight title="Top comic" href={comicHref(topComic.uuid)} image={topComic.coverImage} name={topComic.title}>
              {formatCount(topComic.views)} reads · {formatCount(topComic.likes)} likes
            </Highlight>
          )}
          {topShort && (
            <Highlight title="Top short" href={`/shorts?short=${topShort.uuid}`} image={topShort.coverImage} name={topShort.title}>
              {formatCount(topShort.views)} views · {formatCount(topShort.likes)} likes
            </Highlight>
          )}
        </div>
      )}

      {comics.length > 0 && <ComicsTable comics={comics} />}
      {sample && <Activity comics={comics} />}
    </>
  );
}

// Where each "create" action lands (inside its Studio section).
const CREATE_PATH: Partial<Record<Parameters<typeof studioPage>[0], string>> = { comics: "/creator/comics/new", shorts: "/creator/shorts/new" };

function StudioAction({ pageId, label, ghost = false }: { pageId: Parameters<typeof studioPage>[0]; label: string; ghost?: boolean }) {
  const page = { ...studioPage(pageId), href: CREATE_PATH[pageId] ?? studioPage(pageId).href };
  const className = `btn ${ghost ? "btn-ghost" : "btn-primary"} gap-2 px-5 py-2.5 text-sm`;
  return page.ready ? (
    <Link href={page.href} className={className}><IoAdd /> {label}</Link>
  ) : (
    <span className={`${className} cursor-not-allowed opacity-50`} title="Being built next"><IoAdd /> {label}</span>
  );
}

function Checklist() {
  const { comics } = useStudioComics("new", []);
  const { shorts } = useStudioShorts("new", []);
  const { profile } = useMockCreator();
  const steps = [
    { label: "Become a creator", body: "You're set up. Welcome aboard.", done: true },
    {
      label: "Finish your profile",
      body: "Add a bio, avatar and banner so readers know who you are.",
      page: "profile" as const,
      cta: "Edit profile",
      done: Boolean(profile?.bio && profile.avatar),
    },
    {
      label: "Publish your first comic",
      body: "Upload a cover, write a synopsis and add your first episode.",
      page: "comics" as const,
      cta: "New comic",
      done: comics.some((c) => c.status !== "draft"),
    },
    {
      label: "Upload a short",
      body: "A short trailer or animation brings readers to your comic.",
      page: "shorts" as const,
      cta: "Upload short",
      done: shorts.some((s) => s.status !== "draft"),
    },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <section aria-labelledby="checklist-title" className="mt-8 border-2 border-mint bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="checklist-title" className="font-display text-3xl uppercase leading-none text-white">Get started</h2>
        <p className="text-sm text-slate-400">{done} of {steps.length} done</p>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {steps.map((s) => (
          <span key={s.label} className={`h-1.5 flex-1 ${s.done ? "bg-mint" : "bg-line"}`} />
        ))}
      </div>
      <ol className="mt-5 grid gap-3">
        {steps.map((step) => {
          const page = step.page && !step.done ? { ...studioPage(step.page), href: CREATE_PATH[step.page] ?? studioPage(step.page).href } : null;
          return (
            <li key={step.label} className="flex items-center gap-4 border-2 border-line bg-ink px-4 py-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 text-lg ${
                  step.done ? "border-black bg-mint text-ink" : "border-line text-transparent"
                }`}
              >
                <IoCheckmark />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${step.done ? "text-slate-400 line-through" : "text-white"}`}>{step.label}</p>
                <p className="text-sm text-slate-400">{step.body}</p>
              </div>
              {page &&
                (page.ready ? (
                  <Link href={page.href} className="btn btn-ghost hidden shrink-0 px-4 py-2 text-sm lg:inline-flex">{step.cta}</Link>
                ) : (
                  <span className="hidden shrink-0 text-xs font-bold uppercase tracking-wide text-slate-600 lg:inline">Soon</span>
                ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Stat({ icon: Icon, label, value, sample = false }: { icon: IconType; label: string; value: string; sample?: boolean }) {
  return (
    <li className="border-2 border-line bg-panel p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="text-base text-mint" /> {label}
      </p>
      <p className="mt-2 font-display text-4xl leading-none text-white">{value}</p>
      {sample && <p className="mt-2 text-slate-500"><SampleStamp /></p>}
    </li>
  );
}

const DAY_MS = 86_400_000;
const dayLabel = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Reads per day as comic-panel bars. Real daily reads need the live API; the demo's are a sample.
function ReadsChart({ daily }: { daily: number[] | null }) {
  const values = daily ?? Array.from({ length: 30 }, () => 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <section aria-labelledby="chart-title" className="mt-8 border-2 border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="chart-title" className="font-display text-3xl uppercase leading-none text-white">Reads · last 30 days</h2>
          <p className="mt-1 text-sm text-slate-400">{daily ? `${total.toLocaleString()} reads` : "Your chart starts with your first read."}</p>
        </div>
        {daily && <span className="text-slate-500"><SampleStamp /></span>}
      </div>
      <div className="mt-6 flex h-40 items-end gap-[3px]" role="img" aria-label={daily ? `Reads per day, ${total} in 30 days` : "No reads yet"}>
        {values.map((v, i) => (
          <span
            key={i}
            title={`${dayLabel(values.length - 1 - i)}: ${v} reads`}
            className={`flex-1 ${daily ? "border-2 border-black bg-mint hover:bg-white" : "bg-line"}`}
            style={{ height: `${Math.max(daily ? 4 : 2, (v / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{dayLabel(29)}</span>
        <span>{dayLabel(15)}</span>
        <span>Today</span>
      </div>
    </section>
  );
}

function Highlight({ title, href, image, name, children }: { title: string; href: string; image: string; name: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-4 border-2 border-line bg-panel p-4 transition-colors hover:border-mint">
      <img src={cloudinary(image, 240)} alt="" className="aspect-[3/4] w-16 shrink-0 border-2 border-black object-cover" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        <p className="mt-1 truncate font-display text-2xl uppercase leading-tight text-white group-hover:text-mint">{name}</p>
        <p className="text-sm text-slate-400">{children}</p>
      </div>
    </Link>
  );
}

function ComicsTable({ comics }: { comics: Comic[] }) {
  return (
    <section aria-labelledby="your-comics" className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-line pb-3">
        <h2 id="your-comics" className="font-display text-3xl uppercase leading-none text-white">Your comics</h2>
        <span className="pb-0.5 text-sm text-slate-400">{comicCount(comics.length)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 font-semibold">Comic</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 text-right font-semibold">Episodes</th>
              <th className="pb-2 text-right font-semibold">Reads</th>
              <th className="pb-2 text-right font-semibold">Likes</th>
              <th className="pb-2 text-right font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {comics.map((c) => (
              <tr key={c.uuid} className="border-t-2 border-line">
                <td className="py-2.5 pr-4">
                  <Link href={comicHref(c.uuid)} className="flex items-center gap-3 font-semibold text-white hover:text-mint">
                    <img src={cloudinary(c.coverImage, 120)} alt="" className="aspect-[3/4] w-8 border-2 border-line object-cover" />
                    {c.title}
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`tag ${c.status === "COMPLETED" ? "bg-paper" : "bg-mint"}`}>{c.status === "COMPLETED" ? "Completed" : "Ongoing"}</span>
                </td>
                <td className="py-2.5 text-right text-slate-300">{c.episodes ?? "–"}</td>
                <td className="py-2.5 text-right text-slate-300">{formatCount(c.views)}</td>
                <td className="py-2.5 text-right text-slate-300">{formatCount(c.likes)}</td>
                <td className="py-2.5 text-right text-slate-400">{timeAgo(c.lastEpisodeAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// What's been happening. Needs the live API; the demo's entries are a sample built on real titles.
function Activity({ comics }: { comics: Comic[] }) {
  const titles = comics.map((c) => c.title);
  const items = [
    { text: "18 new followers this week", time: "This week" },
    titles[0] && { text: `42 episode unlocks on ${titles[0]}`, time: "Last 7 days" },
    titles[1] && { text: `New comment on ${titles[1]}`, time: "2h ago" },
    titles[0] && { text: `${titles[0]} reached a new reads milestone`, time: "3d ago" },
  ].filter(Boolean) as { text: string; time: string }[];

  return (
    <section aria-labelledby="activity-title" className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-line pb-3">
        <h2 id="activity-title" className="font-display text-3xl uppercase leading-none text-white">Recent activity</h2>
        <span className="text-slate-500"><SampleStamp /></span>
      </div>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-center justify-between gap-4 border-2 border-line bg-panel px-4 py-3 text-sm">
            <span className="text-slate-200">{item.text}</span>
            <span className="shrink-0 text-xs text-slate-500">{item.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
