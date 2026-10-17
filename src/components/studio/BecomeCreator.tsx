"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { USERNAME_PATTERN } from "@/lib/auth";
import { useMockCreator } from "@/lib/mockCreator";
import { useMockSession } from "@/lib/mockSession";

const MAKES = [
  { value: "comics", label: "Comics", hint: "Mafiki, episode by episode" },
  { value: "shorts", label: "Shorts", hint: "Animated videos" },
] as const;

// One screen between "reader" and "creator": open to anyone signed in, no approval step.
// (If the client wants to vet creators, this becomes an application with a "pending review" state.)
export function BecomeCreator() {
  const { user } = useMockSession();
  const { become } = useMockCreator();
  const [name, setName] = useState(user?.name ?? "");
  const [handle, setHandle] = useState(user?.username ?? "");
  const [makes, setMakes] = useState<("comics" | "shorts")[]>(["comics"]);
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: !name.trim() ? "Enter the name readers will see." : null,
    handle: !USERNAME_PATTERN.test(handle) ? "3–20 letters, numbers or underscores." : null,
    makes: makes.length === 0 ? "Pick at least one." : null,
    terms: !terms ? "Please accept to continue." : null,
  };
  const show = (key: keyof typeof errors) => submitted && errors[key];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    become({ name: name.trim(), handle, makes, bio: "" });
  };

  const input = "h-11 w-full border-2 bg-ink px-3 text-base text-white outline-none focus:border-mint";

  return (
    <div className="max-w-xl">
      <span className="tag -rotate-2 bg-sun text-sm">For creators</span>
      <h1 className="mt-4 font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">Publish on Toon Central</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Set up your creator profile to publish comics and shorts. It&apos;s free, and you can change all of this later.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5 border-2 border-line bg-panel p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-200">Creator name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} ${show("name") ? "border-sun" : "border-line"}`} />
            {show("name") && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.name}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-200">Handle</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              spellCheck={false}
              className={`${input} ${show("handle") ? "border-sun" : "border-line"}`}
            />
            <span className={`mt-1.5 block text-xs ${show("handle") ? "font-semibold text-sun" : "text-slate-500"}`}>
              {show("handle") ? errors.handle : `Your page: /creators/${handle.toLowerCase() || "you"}`}
            </span>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-200">What will you make?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {MAKES.map(({ value, label, hint }) => {
              const on = makes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMakes((m) => (on ? m.filter((x) => x !== value) : [...m, value]))}
                  className={`border-2 px-4 py-3 text-left ${on ? "border-black bg-mint text-ink shadow-[3px_3px_0_#000]" : "border-line text-slate-200 hover:border-mint"}`}
                >
                  <span className="block font-display text-xl uppercase leading-none">{label}</span>
                  <span className={`mt-1 block text-xs ${on ? "text-ink/70" : "text-slate-400"}`}>{hint}</span>
                </button>
              );
            })}
          </div>
          {show("makes") && <p className="mt-1.5 text-xs font-semibold text-sun">{errors.makes}</p>}
        </fieldset>

        <label className="flex items-start gap-3 text-sm leading-6 text-slate-300">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-mint)]" />
          <span>
            I own the rights to what I publish and agree to the{" "}
            <Link href="/terms" className="font-semibold text-white underline-offset-4 hover:underline">creator terms</Link>.
            {show("terms") && <span className="block font-semibold text-sun">{errors.terms}</span>}
          </span>
        </label>

        <button type="submit" className="btn btn-primary h-12 w-full text-base sm:w-fit sm:px-8">Open my Studio</button>
      </form>
    </div>
  );
}
