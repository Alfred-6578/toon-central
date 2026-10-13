"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { IoCheckmarkCircle, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { authHref, PASSWORD_MIN, USERNAME_PATTERN, type AuthMode } from "@/lib/auth";
import { useMockSession } from "@/lib/mockSession";

type Values = { username: string; email: string; password: string; terms: boolean };
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { username: "", email: "", password: "", terms: false };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

const COPY: Record<AuthMode, { title: string; lede: string; submit: string }> = {
  signin: { title: "Welcome back", lede: "Sign in to pick up your library, your place in every comic and your Premium.", submit: "Sign in" },
  signup: { title: "Join Toon Central", lede: "Free to join. Save comics, follow creators and get told when new episodes drop.", submit: "Create account" },
  forgot: { title: "Reset password", lede: "Enter the email on your account and we'll send you a link to set a new password.", submit: "Send reset link" },
};

function validate(mode: AuthMode, v: Values): Errors {
  const errors: Errors = {};
  if (mode === "signup" && !USERNAME_PATTERN.test(v.username)) errors.username = "3–20 letters, numbers or underscores.";
  if (!EMAIL_PATTERN.test(v.email.trim())) errors.email = "Enter a valid email address.";
  if (mode !== "forgot" && v.password.length < PASSWORD_MIN) {
    errors.password = mode === "signup" ? `Use at least ${PASSWORD_MIN} characters.` : "Enter your password.";
  }
  if (mode === "signup" && !v.terms) errors.terms = "Please accept to continue.";
  return errors;
}

// Sign in, join and password reset. Preview only: nothing is sent anywhere. Submitting flips the
// mock session on (src/lib/mockSession.ts) and returns the reader to where they came from.
export function AuthForm({ mode, next, referrer = null }: { mode: AuthMode; next: string; referrer?: string | null }) {
  const router = useRouter();
  const { user, signIn, signOut } = useMockSession();
  const [values, setValues] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const errors = submitted ? validate(mode, values) : {};
  const copy = COPY[mode];

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  // Stand-in for the network round trip, so the button's busy state is visible.
  const finish = () => {
    setPending(true);
    setTimeout(() => {
      signIn();
      router.replace(next);
      // The reader decides access on the server; re-render so an unlocked episode arrives.
      router.refresh();
    }, 600);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(mode, values)).length) return;

    if (mode === "forgot") {
      setPending(true);
      setTimeout(() => {
        setPending(false);
        setResetSent(true);
        setResendIn(RESEND_SECONDS);
      }, 600);
      return;
    }
    finish();
  };

  if (user && mode !== "forgot") {
    return (
      <Card title="You're signed in">
        <p className="text-sm leading-6 text-slate-300">
          Signed in as <span className="font-semibold text-white">{user.name}</span> (@{user.username}).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={next} className="btn btn-primary px-6 py-3 text-base">Continue</Link>
          <button type="button" onClick={signOut} className="btn btn-ghost px-6 py-3 text-base">Sign out</button>
        </div>
      </Card>
    );
  }

  if (mode === "forgot" && resetSent) {
    return (
      <Card title="Check your inbox">
        <p className="flex gap-2 text-sm leading-6 text-slate-300">
          <IoCheckmarkCircle className="mt-1 shrink-0 text-mint" />
          <span>
            If <span className="font-semibold text-white">{values.email.trim()}</span> has an account, a reset link is on its way. It can take a
            minute; check spam too.
          </span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link href={authHref("signin", next)} className="btn btn-primary px-6 py-3 text-base">Back to sign in</Link>
          <button
            type="button"
            disabled={resendIn > 0}
            onClick={() => setResendIn(RESEND_SECONDS)}
            className="text-sm font-semibold text-slate-300 underline-offset-4 hover:underline disabled:text-slate-600 disabled:no-underline"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend link"}
          </button>
        </div>
        <PreviewNote />
      </Card>
    );
  }

  return (
    <Card title={copy.title} lede={copy.lede}>
      {referrer && (
        <p className="-mt-3 mb-6 w-fit border-2 border-black bg-sun px-3 py-1.5 text-sm font-bold text-ink shadow-[3px_3px_0_#000]">
          Invited by @{referrer}
        </p>
      )}
      {mode !== "forgot" && (
        <>
          <button
            type="button"
            onClick={finish}
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-3 border-2 border-black bg-white font-semibold text-ink shadow-[3px_3px_0_#000] transition-transform hover:-translate-y-px disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500" aria-hidden="true">
            <span className="h-0.5 flex-1 bg-line" /> or <span className="h-0.5 flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {mode === "signup" && (
          <Field
            label="Username"
            hint="How you'll appear in comments. Letters, numbers and _."
            error={errors.username}
            value={values.username}
            onChange={(e) => set("username", e.target.value)}
            autoComplete="username"
            spellCheck={false}
          />
        )}

        <Field
          label="Email"
          type="email"
          error={errors.email}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="email"
          spellCheck={false}
        />
        {mode !== "forgot" && (
          <PasswordField
            mode={mode}
            value={values.password}
            error={errors.password}
            onChange={(p) => set("password", p)}
            forgotHref={mode === "signin" ? authHref("forgot", next) : undefined}
          />
        )}

        {mode === "signup" && (
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={values.terms}
              onChange={(e) => set("terms", e.target.checked)}
              aria-invalid={!!errors.terms}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-mint)]"
            />
            <span>
              I agree to the <Link href="/terms" className="font-semibold text-white underline-offset-4 hover:underline">Terms</Link> and{" "}
              <Link href="/policies" className="font-semibold text-white underline-offset-4 hover:underline">Privacy policy</Link>.
              {errors.terms && <span className="block text-sun">{errors.terms}</span>}
            </span>
          </label>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary mt-2 h-12 w-full text-base disabled:opacity-70">
          {pending ? "One moment…" : copy.submit}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        {mode === "signin" && (
          <>New here? <Link href={authHref("signup", next)} className="font-semibold text-mint underline-offset-4 hover:underline">Join Toon Central</Link></>
        )}
        {mode === "signup" && (
          <>Already have an account? <Link href={authHref("signin", next)} className="font-semibold text-mint underline-offset-4 hover:underline">Sign in</Link></>
        )}
        {mode === "forgot" && (
          <>Remembered it? <Link href={authHref("signin", next)} className="font-semibold text-mint underline-offset-4 hover:underline">Back to sign in</Link></>
        )}
      </p>
      <PreviewNote />
    </Card>
  );
}

function Card({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">{title}</h1>
      {lede && <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{lede}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function PreviewNote() {
  return (
    <p className="mt-6 border-2 border-dashed border-line px-4 py-3 text-xs leading-5 text-slate-500">
      Preview: any details work and nothing is sent. Real accounts arrive with the live API.
    </p>
  );
}

const inputBase =
  "h-12 w-full border-2 bg-ink px-3 text-base text-white outline-none transition-colors placeholder:text-slate-600 focus:border-mint";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

function Field({ label, hint, error, className = "", ...input }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-200">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${inputBase} ${error ? "border-sun" : "border-line"} ${className}`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-sun">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function PasswordField({
  mode,
  value,
  error,
  onChange,
  forgotHref,
}: {
  mode: AuthMode;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  forgotHref?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-slate-200">Password</label>
        {forgotHref && <Link href={forgotHref} className="text-xs font-semibold text-slate-400 hover:text-mint">Forgot password?</Link>}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          aria-invalid={!!error}
          aria-describedby={`${id}-note`}
          className={`${inputBase} pr-12 ${error ? "border-sun" : "border-line"}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-lg text-slate-400 hover:text-white"
        >
          {visible ? <IoEyeOffOutline /> : <IoEyeOutline />}
        </button>
      </div>
      <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? "font-semibold text-sun" : "text-slate-500"}`}>
        {error ?? (mode === "signup" ? `At least ${PASSWORD_MIN} characters.` : "")}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
