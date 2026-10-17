"use client";

import { useState, type FormEvent } from "react";
import { DAYS, MAX_GENRES, SYNOPSIS_MAX, type StudioComic } from "@/lib/studioModel";
import { GenreSelect } from "./GenreSelect";
import { ImageDrop } from "./ImageDrop";

export type ComicDetails = Pick<StudioComic, "title" | "synopsis" | "cover" | "banner" | "genres" | "schedule">;

type ComicFormProps = {
  initial: ComicDetails;
  genres: string[];
  submitLabel: string;
  onSubmit: (details: ComicDetails) => void;
  onCancel?: () => void;
};

const TITLE_MAX = 60;

// Details shared by "New comic" and "Edit details".
export function ComicForm({ initial, genres, submitLabel, onSubmit, onCancel }: ComicFormProps) {
  const [details, setDetails] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof ComicDetails>(key: K, value: ComicDetails[K]) => setDetails((d) => ({ ...d, [key]: value }));

  const errors = {
    title: !details.title.trim() ? "Give your comic a title." : null,
    synopsis: details.synopsis.trim().length < 20 ? "Write at least a sentence or two (20+ characters)." : null,
    cover: !details.cover ? "A cover is required: it's what readers see first." : null,
    genres: details.genres.length === 0 ? "Pick at least one genre." : null,
  };
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onSubmit({ ...details, title: details.title.trim(), synopsis: details.synopsis.trim() });
  };

  const input = "w-full border-2 bg-ink px-3 text-base text-white outline-none focus:border-mint";

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="grid content-start gap-6">
        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
            Title <span className="font-normal text-slate-500">{details.title.length}/{TITLE_MAX}</span>
          </span>
          <input
            value={details.title}
            maxLength={TITLE_MAX}
            onChange={(e) => set("title", e.target.value)}
            className={`${input} h-12 font-display text-2xl uppercase ${show("title") ? "border-sun" : "border-line"}`}
          />
          {show("title") && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.title}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
            Synopsis <span className="font-normal text-slate-500">{details.synopsis.length}/{SYNOPSIS_MAX}</span>
          </span>
          <textarea
            value={details.synopsis}
            maxLength={SYNOPSIS_MAX}
            rows={5}
            onChange={(e) => set("synopsis", e.target.value)}
            placeholder="What's the story? Hook readers in the first line."
            className={`${input} py-2.5 placeholder:text-slate-600 ${show("synopsis") ? "border-sun" : "border-line"}`}
          />
          {show("synopsis") && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.synopsis}</span>}
        </label>

        <fieldset>
          <legend className="mb-2 flex w-full justify-between text-sm font-semibold text-slate-200">
            Genres <span className="font-normal text-slate-500">{details.genres.length}/{MAX_GENRES}</span>
          </legend>
          <GenreSelect options={genres} value={details.genres} onChange={(g) => set("genres", g)} max={MAX_GENRES} invalid={!!show("genres")} />
          {show("genres") && <p className="mt-1.5 text-xs font-semibold text-sun">{errors.genres}</p>}
        </fieldset>

        <label className="block max-w-xs">
          <span className="mb-1.5 block text-sm font-semibold text-slate-200">Update schedule</span>
          <select
            value={details.schedule ?? ""}
            onChange={(e) => set("schedule", e.target.value || null)}
            className={`${input} h-11 border-line`}
          >
            <option value="">No fixed day</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                Every {day}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-xs text-slate-500">Shown to readers as &quot;Updates {details.schedule ?? "…"}s&quot; while you keep to it.</span>
        </label>

        <ImageDrop
          label="Banner (optional)"
          hint="Wide image behind your comic's page header. 1600px+ wide works best."
          value={details.banner}
          onChange={(ref) => set("banner", ref)}
          aspect="aspect-[16/6]"
          maxWidth={1600}
        />

        <div className="flex flex-wrap gap-3 border-t-2 border-line pt-6">
          <button type="submit" className="btn btn-primary px-6 py-3 text-base">{submitLabel}</button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-ghost px-6 py-3 text-base">Cancel</button>
          )}
        </div>
      </div>

      <div>
        <ImageDrop
          label="Cover"
          hint="Portrait, 3:4. This is how it's cropped on cards."
          value={details.cover}
          onChange={(ref) => set("cover", ref)}
          aspect="aspect-[3/4]"
          maxWidth={900}
        />
        {show("cover") && <p className="mt-1.5 text-xs font-semibold text-sun">{errors.cover}</p>}
      </div>
    </form>
  );
}
