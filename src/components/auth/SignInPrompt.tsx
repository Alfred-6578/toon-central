import Link from "next/link";
import { authHref } from "@/lib/auth";

// What signed-out visitors see on account pages: why to sign in, and a way back here afterwards.
export function SignInPrompt({ title, body, next }: { title: string; body: string; next: string }) {
  return (
    <div className="border-2 border-line bg-panel px-6 py-12 text-center">
      <p className="font-display text-4xl uppercase leading-none text-white">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{body}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={authHref("signin", next)} className="btn btn-ghost px-6 py-3 text-base">Sign in</Link>
        <Link href={authHref("signup", next)} className="btn btn-primary px-6 py-3 text-base">Join free</Link>
      </div>
    </div>
  );
}
