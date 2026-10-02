import { CreatorAvatar } from "@/components/ui/CreatorAvatar";
import type { Comic, Creator } from "@/lib/api/types";
import { cloudinary, comicHref, formatCount } from "@/lib/format";

type CreatorGroup = { creator: Creator; comics: Comic[]; reads: number; latest: string; inTopTen: boolean };

const creatorHref = (username: string) => `/creators/${encodeURIComponent(username)}`;

// One shelf per creator. Creators the reader hasn't just seen in the Top 10 lead, freshest first.
function groupByCreator(comics: Comic[], topTenIds: Set<string>): CreatorGroup[] {
  const groups = new Map<string, CreatorGroup>();
  for (const comic of comics) {
    const key = comic.creator.username;
    const group = groups.get(key) ?? { creator: comic.creator, comics: [], reads: 0, latest: "", inTopTen: false };
    group.comics.push(comic);
    group.reads += comic.views;
    group.latest = [group.latest, comic.lastEpisodeAt ?? ""].sort().at(-1)!;
    group.inTopTen ||= topTenIds.has(comic.uuid);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => Number(a.inTopTen) - Number(b.inTopTen) || b.latest.localeCompare(a.latest));
}

function CreatorShelf({ group }: { group: CreatorGroup }) {
  const { creator, comics, reads } = group;

  return (
    <article className="flex h-full flex-col border-2 border-line bg-panel p-4 transition-shadow hover:border-mint hover:shadow-[6px_6px_0_var(--color-mint-deep)]">
      <a href={creatorHref(creator.username)} className="group flex items-center gap-3">
        <CreatorAvatar creator={creator} genre={comics[0]?.genres[0]} />
        <div className="min-w-0">
          <p className="truncate font-bold text-white group-hover:text-mint">{creator.username}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {comics.length} series · {formatCount(reads)} reads
          </p>
        </div>
      </a>

      {comics.length === 1 ? (
        <SingleSeries comic={comics[0]} />
      ) : (
        <ul className="mt-4 grid grid-cols-4 gap-2.5">
          {comics.slice(0, 4).map((comic) => (
            <li key={comic.uuid} className="min-w-0">
              <a href={comicHref(comic.uuid)} className="group block">
                <Cover comic={comic} />
                <p className="mt-1.5 truncate text-xs font-semibold text-white group-hover:text-mint">{comic.title}</p>
                <p className="text-[11px] text-slate-400">{seriesMeta(comic)}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

const seriesMeta = (comic: Comic) =>
  `${comic.episodes != null ? `${comic.episodes} ch` : `${formatCount(comic.views)} reads`}${comic.status === "COMPLETED" ? " · Done" : ""}`;

function Cover({ comic }: { comic: Comic }) {
  return (
    <div className="aspect-[3/4] overflow-hidden border-2 border-line bg-ink group-hover:border-mint">
      <img src={cloudinary(comic.coverImage, 240)} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

// A creator with one series gets that series' blurb beside the cover instead of an empty row.
function SingleSeries({ comic }: { comic: Comic }) {
  return (
    <a href={comicHref(comic.uuid)} className="group mt-4 flex gap-4">
      <div className="w-24 shrink-0">
        <Cover comic={comic} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white group-hover:text-mint">{comic.title}</p>
        <p className="text-[11px] text-slate-400">{seriesMeta(comic)}</p>
        {comic.description && <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-300">{comic.description}</p>}
      </div>
    </a>
  );
}

// Closes the indie section with the creator pitch the live site has: an empty panel waiting for a story.
function PublishCard() {
  return (
    <div className="relative flex flex-col items-start justify-between gap-5 overflow-hidden border-2 border-dashed border-mint bg-ink p-6 sm:flex-row sm:items-center md:col-span-2 lg:col-span-3">
      <div className="halftone-fade pointer-events-none absolute inset-0" />
      <div className="relative">
        <p className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">Your story could be here</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
          Publish your comic or animated short on Toon Central and reach readers across Africa.
        </p>
      </div>
      <div className="relative flex flex-wrap gap-3">
        <a href="/creator/new" className="btn btn-primary px-5 py-3">Start publishing</a>
        <a href="/creator101" className="btn btn-ghost px-5 py-3">Creator101 guide</a>
      </div>
    </div>
  );
}

export function CreatorShelves({ comics, topTenIds }: { comics: Comic[]; topTenIds: Set<string> }) {
  const groups = groupByCreator(comics, topTenIds);

  return (
    <>
      <div className="hide-scrollbar -mx-6 overflow-x-auto px-6 pb-3 md:hidden">
        <div className="flex w-max gap-4">
          {groups.map((group) => (
            <div key={group.creator.username} className="w-[78vw] max-w-[340px]">
              <CreatorShelf group={group} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.creator.username} className="hidden md:block">
            <CreatorShelf group={group} />
          </div>
        ))}
        <PublishCard />
      </div>
    </>
  );
}
