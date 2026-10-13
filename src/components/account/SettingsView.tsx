"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { IoCheckmarkCircle } from "react-icons/io5";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { Avatar } from "@/components/layout/nav/Menus";
import { authHref, USERNAME_PATTERN } from "@/lib/auth";
import { useLocalValue } from "@/lib/localValue";
import { updateProfile, useMockSession, useHydrated } from "@/lib/mockSession";
import { clearProgress, useReadingProgress } from "@/lib/readingProgress";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "reading", label: "Reading" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
];

const BIO_MAX = 160;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same keys the reader uses, so a change here is what the reader picks up.
const SPEED_KEY = "tc-reader-speed";
const TOUR_KEY = "tc-reader-tour-seen";
const NOTIFY_KEY = "tc-settings-notify";

const NOTIFY_OPTIONS = [
  { key: "episodes", label: "New episodes", hint: "When a comic in your library gets a new episode.", fallback: true },
  { key: "creators", label: "Creators you follow", hint: "New comics and shorts from them.", fallback: true },
  { key: "replies", label: "Replies", hint: "When someone replies to your comment.", fallback: true },
  { key: "email", label: "Email newsletter", hint: "Occasional picks and news from Toon Central.", fallback: false },
] as const;

// Account settings. Preview only: edits are kept in this browser and the mock profile picks them up,
// so the header and /me show the new name straight away.
export function SettingsView() {
  const { user } = useMockSession();

  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (!user) {
    return <SignInPrompt title="Settings" body="Sign in to change your profile, reading and notification settings." next="/settings" />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="hide-scrollbar -mx-6 overflow-x-auto px-6 lg:sticky lg:top-24 lg:mx-0 lg:self-start lg:px-0">
        <ul className="flex gap-2 lg:flex-col lg:gap-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block whitespace-nowrap border-2 border-line px-3 py-1.5 text-sm font-semibold text-slate-300 hover:border-mint hover:text-white lg:border-0 lg:border-l-2 lg:px-4">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-8">
        <ProfileSection />
        <AccountSection />
        <ReadingSection />
        <NotificationsSection />
        <PrivacySection />
        <p className="border-2 border-dashed border-line px-4 py-3 text-xs leading-5 text-slate-500">
          Preview: settings are saved in this browser only. They move to your account once the live API is connected.
        </p>
      </div>
    </div>
  );
}

function Section({ id, title, lede, children }: { id: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-2 border-line bg-panel p-5 sm:p-6">
      <h2 id={`${id}-title`} className="font-display text-3xl uppercase leading-none text-white">{title}</h2>
      {lede && <p className="mt-2 text-sm text-slate-400">{lede}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const inputClass = "w-full border-2 bg-ink px-3 text-base text-white outline-none transition-colors focus:border-mint";

function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-200">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`${inputClass} h-11 ${error ? "border-sun" : "border-line"}`}
        {...rest}
      />
      {(error || hint) && <span className={`mt-1.5 block text-xs ${error ? "font-semibold text-sun" : "text-slate-500"}`}>{error ?? hint}</span>}
    </label>
  );
}

function SaveRow({ saved, label = "Save changes" }: { saved: boolean; label?: string }) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <button type="submit" className="btn btn-primary px-5 py-2.5 text-sm">{label}</button>
      {saved && (
        <span role="status" className="flex items-center gap-1.5 text-sm font-semibold text-mint">
          <IoCheckmarkCircle /> Saved
        </span>
      )}
    </div>
  );
}

// "Saved" shows until the next edit.
function useSavedFlag() {
  const [saved, setSaved] = useState(false);
  return { saved, markSaved: () => setSaved(true), clear: () => setSaved(false) };
}

function ProfileSection() {
  const { user } = useMockSession();
  const [name, setName] = useState(user!.name);
  const [username, setUsername] = useState(user!.username);
  const [bio, setBio] = useState(user!.bio);
  const [submitted, setSubmitted] = useState(false);
  const { saved, markSaved, clear } = useSavedFlag();

  const errors = {
    name: submitted && !name.trim() ? "Enter a display name." : undefined,
    username: submitted && !USERNAME_PATTERN.test(username) ? "3–20 letters, numbers or underscores." : undefined,
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !USERNAME_PATTERN.test(username)) return;
    updateProfile({ name: name.trim(), username, bio: bio.trim() });
    markSaved();
  };

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    clear();
  };

  return (
    <Section id="profile" title="Profile" lede="How you appear to creators and other readers.">
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-6 flex items-center gap-4">
          <Avatar user={{ ...user!, initials: initials(name) }} className="h-16 w-16 text-2xl" />
          <p className="text-xs leading-5 text-slate-500">Your initials for now. Photo upload arrives with the live API.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Display name" value={name} onChange={edit(setName)} error={errors.name} autoComplete="name" />
          <TextField label="Username" value={username} onChange={edit(setUsername)} error={errors.username} hint="Shown as @username." autoComplete="username" />
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
            Bio <span className="font-normal text-slate-500">{bio.length}/{BIO_MAX}</span>
          </span>
          <textarea
            value={bio}
            onChange={(e) => edit(setBio)(e.target.value.slice(0, BIO_MAX))}
            rows={3}
            placeholder="What do you love reading?"
            className={`${inputClass} border-line py-2.5 placeholder:text-slate-600`}
          />
        </label>
        <SaveRow saved={saved} />
      </form>

      <ReferralLink />
    </Section>
  );
}

// The reader's invite link: /auth/signup?ref=username, so the join page can credit them.
function ReferralLink() {
  const { user } = useMockSession();
  const [status, setStatus] = useState<string | null>(null);
  // Only rendered after hydration (SettingsView waits), so window is available.
  const url = `${window.location.origin}/auth/signup?ref=${encodeURIComponent(user!.username)}`;

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch {
      flash("Couldn't copy, select the link instead");
    }
  };

  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: "Join me on Toon Central", text: "Read Mafiki and watch African animated shorts with me on Toon Central.", url });
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") copy();
    }
  };

  return (
    <div className="mt-8 border-t-2 border-line pt-6">
      <p className="text-sm font-semibold text-slate-200">Referral link</p>
      <p className="mt-1 text-sm text-slate-400">
        Invite friends to Toon Central. Anyone who joins with your link is credited to you.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Your referral link"
          className={`${inputClass} h-11 min-w-0 flex-1 border-line font-mono text-sm text-slate-300`}
        />
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="btn btn-primary flex-1 px-5 py-2.5 text-sm sm:flex-none">Copy link</button>
          <button type="button" onClick={share} className="btn btn-ghost flex-1 px-5 py-2.5 text-sm sm:flex-none">Share</button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500" role="status">
        {status ?? `${user!.referrals} ${user!.referrals === 1 ? "friend has" : "friends have"} joined with your link.`}
      </p>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";

function AccountSection() {
  const { user } = useMockSession();
  const [email, setEmail] = useState(user!.email);
  const [submitted, setSubmitted] = useState(false);
  const { saved, markSaved, clear } = useSavedFlag();
  const error = submitted && !EMAIL_PATTERN.test(email.trim()) ? "Enter a valid email address." : undefined;

  return (
    <Section id="account" title="Account">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!EMAIL_PATTERN.test(email.trim())) return;
          updateProfile({ email: email.trim() });
          markSaved();
        }}
      >
        <div className="max-w-md">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              clear();
            }}
            error={error}
            autoComplete="email"
          />
        </div>
        <SaveRow saved={saved} label="Update email" />
      </form>

      <div className="mt-8 grid gap-4 border-t-2 border-line pt-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">Password</p>
          <p className="mt-1 text-sm text-slate-400">We&apos;ll email you a link to set a new one.</p>
          <Link href={authHref("forgot", "/settings")} className="mt-3 inline-block text-sm font-semibold text-mint underline-offset-4 hover:underline">
            Change password
          </Link>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Plan</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <span className={`tag ${user!.plan.tier === "Premium" ? "bg-mint" : "bg-paper"}`}>{user!.plan.tier}</span>
            {user!.plan.renews ? `Renews ${user!.plan.renews}` : "Free"}
          </p>
          <Link href="/subscription" className="mt-3 inline-block text-sm font-semibold text-mint underline-offset-4 hover:underline">
            Manage subscription
          </Link>
        </div>
      </div>
    </Section>
  );
}

function ReadingSection() {
  const [speed, setSpeed] = useLocalValue(SPEED_KEY, "0");
  const [tourSeen, setTourSeen] = useLocalValue(TOUR_KEY, "0");
  const history = useReadingProgress();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Section id="reading" title="Reading">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-200">Auto-scroll speed</legend>
        <p className="mt-1 text-sm text-slate-400">Where auto scroll starts in the reader. You can still change it while reading.</p>
        <div className="mt-3 flex border-2 border-line" role="radiogroup" aria-label="Auto-scroll speed">
          {["×1", "×2", "×3"].map((label, i) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={speed === String(i)}
              onClick={() => setSpeed(String(i))}
              className={`flex-1 py-2 font-display text-lg sm:flex-none sm:px-8 ${speed === String(i) ? "bg-mint text-ink" : "text-slate-300 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-6 border-t-2 border-line pt-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">Reader guide</p>
          <p className="mt-1 text-sm text-slate-400">The step-by-step tour of the reader&apos;s buttons.</p>
          <button
            type="button"
            disabled={tourSeen !== "1"}
            onClick={() => setTourSeen("0")}
            className="mt-3 text-sm font-semibold text-mint underline-offset-4 hover:underline disabled:text-slate-500 disabled:no-underline"
          >
            {tourSeen === "1" ? "Show it again next time" : "Will show next time you read"}
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Reading history</p>
          <p className="mt-1 text-sm text-slate-400">
            {history.length ? `${history.length} comics, used for Continue reading.` : "Nothing yet."}
          </p>
          {history.length > 0 &&
            (confirmClear ? (
              <div className="mt-3 flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    clearProgress();
                    setConfirmClear(false);
                  }}
                  className="border-2 border-black bg-sun px-3 py-1.5 font-bold text-ink shadow-[2px_2px_0_#000]"
                >
                  Yes, clear
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} className="font-semibold text-slate-400 hover:text-white">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)} className="mt-3 text-sm font-semibold text-mint underline-offset-4 hover:underline">
                Clear history
              </button>
            ))}
        </div>
      </div>
    </Section>
  );
}

function NotificationsSection() {
  const [raw, setRaw] = useLocalValue(NOTIFY_KEY, "{}");
  const prefs: Record<string, boolean> = JSON.parse(raw);

  return (
    <Section id="notifications" title="Notifications" lede="Saved as soon as you flip a switch.">
      <ul className="divide-y-2 divide-line">
        {NOTIFY_OPTIONS.map((option) => {
          const on = prefs[option.key] ?? option.fallback;
          return (
            <li key={option.key} className="flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-slate-200">{option.label}</p>
                <p className="mt-0.5 text-sm text-slate-400">{option.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={option.label}
                onClick={() => setRaw(JSON.stringify({ ...prefs, [option.key]: !on }))}
                className={`relative h-7 w-12 shrink-0 border-2 transition-colors ${on ? "border-black bg-mint" : "border-line bg-ink"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 border-2 transition-all ${on ? "left-[calc(100%-1.375rem)] border-black bg-ink" : "left-0.5 border-line bg-slate-500"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function PrivacySection() {
  const router = useRouter();
  const { signOut } = useMockSession();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const deleteAccount = () => {
    // Preview: forget everything this browser kept for the mock account.
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("tc-"))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage unavailable: signing out below still works.
    }
    signOut();
    router.push("/");
  };

  return (
    <Section id="privacy" title="Privacy">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">Sign out</p>
          <p className="mt-1 text-sm text-slate-400">Your library stays on this device.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="btn btn-ghost px-5 py-2 text-sm"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 border-t-2 border-line pt-6">
        <p className="text-sm font-semibold text-slate-200">Delete account</p>
        <p className="mt-1 text-sm text-slate-400">
          Removes your profile, library, history and follows. This can&apos;t be undone.
        </p>
        {deleting ? (
          <div className="mt-4 max-w-md border-2 border-sun p-4">
            <label className="block text-sm text-slate-300">
              Type <span className="font-bold text-white">DELETE</span> to confirm
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                className={`${inputClass} mt-2 h-11 border-line`}
              />
            </label>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={confirmText !== "DELETE"}
                onClick={deleteAccount}
                className="border-2 border-black bg-sun px-4 py-2 text-sm font-bold text-ink shadow-[2px_2px_0_#000] disabled:opacity-40 disabled:shadow-none"
              >
                Delete my account
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleting(false);
                  setConfirmText("");
                }}
                className="text-sm font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setDeleting(true)} className="mt-3 text-sm font-semibold text-sun underline-offset-4 hover:underline">
            Delete account…
          </button>
        )}
      </div>
    </Section>
  );
}
