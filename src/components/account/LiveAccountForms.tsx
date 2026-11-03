"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { IoCameraOutline, IoCheckmarkCircle, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { changePasswordAction, updateProfileAction, uploadPhotoAction } from "@/app/auth/actions";
import { Avatar } from "@/components/layout/nav/Menus";
import type { MobileOperator } from "@/lib/api/account";
import { localPhone, PASSWORD_MIN, PHONE_HINT, USERNAME_PATTERN } from "@/lib/auth";
import { loadSession, useMockSession } from "@/lib/mockSession";

// Settings for a real account (accounts live): saved to the API, then the session is re-read so the
// header and /me change straight away. The preview versions live in SettingsView.

const BIO_MAX = 160;
const MIN_AGE = 18;
const inputClass = "h-11 w-full border-2 bg-ink px-3 text-base text-white outline-none transition-colors focus:border-mint";

// The latest date of birth the backend accepts (it refuses anyone under 18), as YYYY-MM-DD.
function latestDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-200">{label}</label>
      {children(id)}
      {(error || hint) && <p className={`mt-1.5 text-xs ${error ? "font-semibold text-sun" : "text-slate-500"}`}>{error ?? hint}</p>}
    </div>
  );
}

function Status({ error, saved, savedText = "Saved" }: { error: string | null; saved: boolean; savedText?: string }) {
  if (error) return <p role="alert" className="text-sm font-semibold text-sun">{error}</p>;
  if (saved) {
    return (
      <span role="status" className="flex items-center gap-1.5 text-sm font-semibold text-mint">
        <IoCheckmarkCircle /> {savedText}
      </span>
    );
  }
  return null;
}

export function LiveProfileForm({ operators }: { operators: MobileOperator[] }) {
  const { user } = useMockSession();
  const [values, setValues] = useState({
    firstName: user!.firstName ?? "",
    lastName: user!.lastName ?? "",
    username: user!.username,
    bio: user!.bio,
    phone: user!.phone ?? "",
    operatorId: user!.operatorId ?? operators[0]?.id ?? 1,
    dob: user!.dob ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };

  const maxDob = latestDob();
  // Accounts made on the old site can have usernames outside today's rule ("Rezzy the artist"); they
  // keep them until they choose a new one.
  const usernameOk = values.username === user!.username || USERNAME_PATTERN.test(values.username);
  const errors = submitted
    ? {
        firstName: values.firstName.trim() ? undefined : "Enter your first name.",
        lastName: values.lastName.trim() ? undefined : "Enter your last name.",
        username: usernameOk ? undefined : "3–20 letters, numbers or underscores.",
        phone: localPhone(values.phone) ? undefined : PHONE_HINT,
        dob: !values.dob ? "Toon Central needs your date of birth." : values.dob > maxDob ? `You need to be at least ${MIN_AGE}.` : undefined,
      }
    : {};

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setError(null);
    const phone = localPhone(values.phone);
    if (!values.firstName.trim() || !values.lastName.trim() || !usernameOk || !phone || !values.dob || values.dob > maxDob) return;
    setPending(true);
    const result = await updateProfileAction({ ...values, phone, bio: values.bio.trim() });
    if (result.ok) {
      await loadSession(true);
      setSaved(true);
    } else setError(result.message);
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <PhotoPicker />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName}>
          {(id) => <input id={id} value={values.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" className={`${inputClass} ${errors.firstName ? "border-sun" : "border-line"}`} />}
        </Field>
        <Field label="Last name" error={errors.lastName}>
          {(id) => <input id={id} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" className={`${inputClass} ${errors.lastName ? "border-sun" : "border-line"}`} />}
        </Field>
        <Field label="Username" error={errors.username} hint="Shown as @username.">
          {(id) => <input id={id} value={values.username} onChange={(e) => set("username", e.target.value)} autoComplete="username" spellCheck={false} className={`${inputClass} ${errors.username ? "border-sun" : "border-line"}`} />}
        </Field>
        <Field label="Date of birth" error={errors.dob} hint={`Toon Central accounts are for ${MIN_AGE} and over.`}>
          {(id) => <input id={id} type="date" max={maxDob} value={values.dob} onChange={(e) => set("dob", e.target.value)} autoComplete="bday" className={`${inputClass} [color-scheme:dark] ${errors.dob ? "border-sun" : "border-line"}`} />}
        </Field>
        <Field label="Phone number" error={errors.phone}>
          {(id) => <input id={id} type="tel" inputMode="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel-national" className={`${inputClass} ${errors.phone ? "border-sun" : "border-line"}`} />}
        </Field>
        <Field label="Network">
          {(id) => (
            <select id={id} value={values.operatorId} onChange={(e) => set("operatorId", Number(e.target.value))} className={`${inputClass} border-line`}>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="mt-4">
        <Field label={`Bio (${values.bio.length}/${BIO_MAX})`}>
          {(id) => (
            <textarea
              id={id}
              value={values.bio}
              onChange={(e) => set("bio", e.target.value.slice(0, BIO_MAX))}
              rows={3}
              placeholder="What do you love reading?"
              className="w-full border-2 border-line bg-ink px-3 py-2.5 text-base text-white outline-none transition-colors placeholder:text-slate-600 focus:border-mint"
            />
          )}
        </Field>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary px-5 py-2.5 text-sm disabled:opacity-70">{pending ? "Saving…" : "Save changes"}</button>
        <Status error={error} saved={saved} />
      </div>
    </form>
  );
}

// A profile photo never needs more than this; shrinking it in the browser keeps the upload small on
// mobile data (and under the server's 1 MB limit for form submissions).
const PHOTO_SIZE = 512;

function squarePhoto(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = Math.min(PHOTO_SIZE, side);
      const ctx = canvas.getContext("2d")!;
      // Centre crop to a square.
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(new File([blob], "photo.jpg", { type: "image/jpeg" })) : reject(new Error("encode"))), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

function PhotoPicker() {
  const { user } = useMockSession();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setSaved(false);
    if (!file.type.startsWith("image/")) return setError("Choose an image (JPG, PNG or WebP).");
    setPending(true);
    try {
      const form = new FormData();
      form.append("photo", await squarePhoto(file));
      const result = await uploadPhotoAction(form);
      if (result.ok) {
        await loadSession(true);
        setSaved(true);
      } else setError(result.message);
    } catch {
      setError("That image couldn't be read. Try another one.");
    }
    setPending(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <Avatar user={user!} className="h-16 w-16 text-2xl" size={128} />
      <div>
        <button type="button" onClick={() => input.current?.click()} disabled={pending} className="btn btn-ghost gap-2 px-4 py-2 text-sm disabled:opacity-70">
          <IoCameraOutline /> {pending ? "Uploading…" : "Change photo"}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        <div className="mt-2 min-h-5">
          <Status error={error} saved={saved} savedText="Photo updated" />
        </div>
      </div>
    </div>
  );
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = submitted
    ? {
        current: current ? undefined : "Enter your current password.",
        next: next.length >= PASSWORD_MIN ? undefined : `Use at least ${PASSWORD_MIN} characters.`,
        confirm: confirm === next ? undefined : "The two new passwords don't match.",
      }
    : {};

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setError(null);
    setSaved(false);
    if (!current || next.length < PASSWORD_MIN || confirm !== next) return;
    setPending(true);
    const result = await changePasswordAction(current, next);
    if (result.ok) {
      setSaved(true);
      setSubmitted(false);
      setCurrent("");
      setNext("");
      setConfirm("");
    } else setError(result.message);
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="text-sm font-semibold text-slate-200">Change password</p>
      <div className="mt-3 grid max-w-md gap-4">
        <PasswordInput label="Current password" error={errors.current} value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordInput label="New password" error={errors.next} hint={`At least ${PASSWORD_MIN} characters.`} value={next} onChange={setNext} autoComplete="new-password" />
        <PasswordInput label="Confirm new password" error={errors.confirm} value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary px-5 py-2.5 text-sm disabled:opacity-70">{pending ? "Updating…" : "Update password"}</button>
        <Status error={error} saved={saved} savedText="Password changed" />
      </div>
    </form>
  );
}

// With a show/hide eye, like the sign-in form's.
function PasswordInput({ label, error, hint, value, onChange, autoComplete }: { label: string; error?: string; hint?: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {(id) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            className={`${inputClass} pr-12 ${error ? "border-sun" : "border-line"}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
            className="absolute right-0.5 top-0.5 flex h-10 w-10 items-center justify-center text-lg text-slate-400 hover:text-white"
          >
            {visible ? <IoEyeOffOutline /> : <IoEyeOutline />}
          </button>
        </div>
      )}
    </Field>
  );
}
