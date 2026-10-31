"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { IoCashOutline, IoCheckmarkCircle, IoMegaphoneOutline, IoWalletOutline } from "react-icons/io5";
import { useLocalValue } from "@/lib/localValue";
import { FREE_EPISODES } from "@/lib/rules";
import { studioHref, type StudioComic, type StudioMode } from "@/lib/studioModel";
import { SampleStamp } from "../StudioGate";

// Nigerian banks and wallets creators commonly use. Account names are confirmed by the bank once
// payouts are connected; until then nothing is checked or sent.
const BANKS = [
  "Access Bank", "Ecobank", "Fidelity Bank", "First Bank", "FCMB", "GTBank", "Kuda", "Moniepoint", "Opay",
  "PalmPay", "Polaris Bank", "Providus Bank", "Stanbic IBTC", "Sterling Bank", "UBA", "Union Bank", "Wema Bank", "Zenith Bank",
];

type Account = { bank: string; number: string; name: string };
type Payout = { id: string; amount: number; at: string; account: string };
type PayoutState = { account: Account | null; payouts: Payout[] };

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Sample = {
  allTime: number;
  paidOut: number;
  bySource: { ads: number; credits: number };
  byComic: { title: string; amount: number }[];
  byMonth: { label: string; amount: number }[];
  pastPayouts: Payout[];
};

// The "established" demo's figures: generated (the real numbers aren't public), so every one is
// stamped "Sample". Total matches the Overview's sample earnings.
function sampleFor(comics: StudioComic[]): Sample {
  const allTime = 48_300;
  const reads = comics.reduce((s, c) => s + c.reads, 0) || 1;
  const now = new Date();
  const weights = [0.12, 0.14, 0.15, 0.17, 0.2, 0.22];
  return {
    allTime,
    paidOut: 35_850,
    bySource: { ads: Math.round(allTime * 0.35), credits: Math.round(allTime * 0.65) },
    byComic: comics.map((c) => ({ title: c.title, amount: Math.round((allTime * c.reads) / reads) })),
    byMonth: weights.map((w, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: MONTHS[d.getMonth()], amount: Math.round(allTime * w) };
    }),
    pastPayouts: [
      { id: "s1", amount: 20_000, at: new Date(now.getFullYear(), now.getMonth() - 3, 28).toISOString(), account: "GTBank ••••4821" },
      { id: "s2", amount: 15_850, at: new Date(now.getFullYear(), now.getMonth() - 1, 28).toISOString(), account: "GTBank ••••4821" },
    ],
  };
}

export function EarningsView({ mode, comics }: { mode: StudioMode; comics: StudioComic[] }) {
  const sample = mode === "established" ? sampleFor(comics) : null;
  const [raw, setRaw] = useLocalValue(`tc-studio-payouts-${mode}`, "");
  let saved: PayoutState = { account: null, payouts: [] };
  try {
    if (raw) saved = JSON.parse(raw);
  } catch {
    // Unreadable save: start clean.
  }
  const write = (next: PayoutState) => setRaw(JSON.stringify(next));

  const allTime = sample?.allTime ?? 0;
  const requested = saved.payouts.reduce((s, p) => s + p.amount, 0);
  const paidOut = (sample?.paidOut ?? 0) + requested;
  const available = Math.max(0, allTime - paidOut);
  const history = [...saved.payouts, ...(sample?.pastPayouts ?? [])].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <div>
        <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl">Earnings</h1>
        <p className="mt-2 text-sm text-slate-400">What your monetized episodes have earned, and getting paid.</p>
      </div>

      {/* Balance: a printed cheque-style card */}
      <section aria-label="Balance" className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="relative border-[3px] border-black bg-paper p-6 text-ink shadow-[6px_6px_0_#000]">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/60">
              <IoWalletOutline className="text-base" /> Available to withdraw
            </p>
            {sample && <span className="text-ink/60"><SampleStamp /></span>}
          </div>
          <p className="mt-2 font-display text-6xl leading-none sm:text-7xl">{naira(available)}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t-2 border-dashed border-ink/30 pt-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Earned all time</p>
              <p className="font-display text-2xl">{naira(allTime)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Paid out</p>
              <p className="font-display text-2xl">{naira(paidOut)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <Source icon={IoMegaphoneOutline} label="From ads" amount={sample?.bySource.ads ?? 0} note="Ads shown on your monetized episodes" sample={!!sample} />
          <Source icon={IoCashOutline} label="From credits" amount={sample?.bySource.credits ?? 0} note="Readers unlocking your episodes" sample={!!sample} />
        </div>
      </section>

      {!sample && (
        <section className="mt-8 border-2 border-dashed border-line p-5 text-sm leading-6 text-slate-300">
          <p className="font-display text-2xl uppercase text-white">How you earn</p>
          <p className="mt-2">
            Episodes 1–{FREE_EPISODES} of every Mafiki are free. From episode {FREE_EPISODES + 1}, switch on <span className="font-semibold text-white">Monetize this episode</span> and choose:
          </p>
          <ul className="mt-2 grid gap-1">
            <li><span className="font-semibold text-white">Ads</span>: ads appear alongside the episode and it stays free for readers.</li>
            <li><span className="font-semibold text-white">Credits</span>: readers unlock it with credits, or a pass or plan.</li>
          </ul>
          <Link href={studioHref("/creator/comics", mode)} className="mt-4 inline-block font-semibold text-mint hover:underline">Go to your Mafiki →</Link>
        </section>
      )}

      {sample && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="by-month" className="border-2 border-line bg-panel p-5">
            <div className="flex items-end justify-between gap-3">
              <h2 id="by-month" className="font-display text-2xl uppercase text-white">Last 6 months</h2>
              <span className="text-slate-500"><SampleStamp /></span>
            </div>
            <div className="mt-5 flex h-36 items-end gap-3">
              {sample.byMonth.map((m) => {
                const max = Math.max(...sample.byMonth.map((x) => x.amount));
                return (
                  <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[11px] text-slate-400">₦{Math.round(m.amount / 1000)}k</span>
                    <span className="w-full border-2 border-black bg-mint" style={{ height: `${(m.amount / max) * 75}%` }} />
                    <span className="text-xs font-semibold text-slate-300">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="by-comic" className="border-2 border-line bg-panel p-5">
            <div className="flex items-end justify-between gap-3">
              <h2 id="by-comic" className="font-display text-2xl uppercase text-white">By Mafiki</h2>
              <span className="text-slate-500"><SampleStamp /></span>
            </div>
            <ul className="mt-4 grid gap-2">
              {sample.byComic.map((c) => (
                <li key={c.title} className="flex items-center justify-between gap-4 border-b-2 border-line pb-2 text-sm last:border-0">
                  <span className="truncate font-semibold text-white">{c.title}</span>
                  <span className="shrink-0 font-display text-xl text-white">{naira(c.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <PayoutAccount account={saved.account} onSave={(account) => write({ ...saved, account })} />
        <Withdraw
          available={available}
          account={saved.account}
          onWithdraw={(amount) =>
            write({
              ...saved,
              payouts: [
                {
                  id: `${Date.now()}`,
                  amount,
                  at: new Date().toISOString(),
                  account: `${saved.account!.bank} ••••${saved.account!.number.slice(-4)}`,
                },
                ...saved.payouts,
              ],
            })
          }
        />
      </div>

      <section aria-labelledby="payouts" className="mt-8">
        <h2 id="payouts" className="border-b-2 border-line pb-3 font-display text-3xl uppercase leading-none text-white">Payout history</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No payouts yet. Withdrawals show here with their status.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {history.map((p) => {
              const preview = saved.payouts.some((s) => s.id === p.id);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-line bg-panel px-4 py-3 text-sm">
                  <span className="font-display text-xl text-white">{naira(p.amount)}</span>
                  <span className="text-slate-400">{p.account}</span>
                  <span className="text-slate-400">{new Date(p.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {preview ? (
                    <span className="tag border border-dashed border-slate-400 bg-transparent text-slate-300">Requested · preview</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="tag bg-mint">Paid</span>
                      <span className="text-slate-500"><SampleStamp /></span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Source({ icon: Icon, label, amount, note, sample }: { icon: typeof IoWalletOutline; label: string; amount: number; note: string; sample: boolean }) {
  return (
    <div className="flex items-center gap-4 border-2 border-line bg-panel p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-mint text-xl text-ink">
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-display text-3xl leading-none text-white">{naira(amount)}</p>
        <p className="mt-1 text-xs text-slate-500">{note}</p>
      </div>
      {sample && <span className="text-slate-500"><SampleStamp /></span>}
    </div>
  );
}

const input = "h-11 w-full border-2 bg-ink px-3 text-base text-white outline-none focus:border-mint";

function PayoutAccount({ account, onSave }: { account: Account | null; onSave: (a: Account) => void }) {
  const [editing, setEditing] = useState(!account);
  const [bank, setBank] = useState(account?.bank ?? "");
  const [number, setNumber] = useState(account?.number ?? "");
  const [name, setName] = useState(account?.name ?? "");
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    bank: !bank ? "Choose your bank." : null,
    number: !/^\d{10}$/.test(number) ? "Nigerian account numbers are 10 digits." : null,
    name: !name.trim() ? "Enter the name on the account." : null,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave({ bank, number, name: name.trim() });
    setEditing(false);
  };

  return (
    <section aria-labelledby="account-title" className="border-2 border-line bg-panel p-5">
      <h2 id="account-title" className="font-display text-2xl uppercase text-white">Payout account</h2>
      {!editing && account ? (
        <div className="mt-4">
          <p className="flex items-center gap-2 font-semibold text-white">
            <IoCheckmarkCircle className="text-mint" /> {account.bank} ••••{account.number.slice(-4)}
          </p>
          <p className="mt-1 text-sm text-slate-400">{account.name}</p>
          <button type="button" onClick={() => setEditing(true)} className="mt-4 text-sm font-semibold text-mint hover:underline">
            Change account
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-200">Bank</span>
            <select value={bank} onChange={(e) => setBank(e.target.value)} className={`${input} ${submitted && errors.bank ? "border-sun" : "border-line"}`}>
              <option value="">Choose a bank</option>
              {BANKS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            {submitted && errors.bank && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.bank}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-200">Account number</span>
            <input
              value={number}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
              className={`${input} tracking-widest ${submitted && errors.number ? "border-sun" : "border-line"}`}
            />
            {submitted && errors.number && <span className="mt-1.5 block text-xs font-semibold text-sun">{errors.number}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-200">Account name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} ${submitted && errors.name ? "border-sun" : "border-line"}`} />
            <span className={`mt-1.5 block text-xs ${submitted && errors.name ? "font-semibold text-sun" : "text-slate-500"}`}>
              {submitted && errors.name ? errors.name : "Must match the name your bank has, or payouts bounce."}
            </span>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary px-5 py-2.5 text-sm">Save account</button>
            {account && (
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost px-5 py-2.5 text-sm">Cancel</button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function Withdraw({ available, account, onWithdraw }: { available: number; account: Account | null; onWithdraw: (amount: number) => void }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!account) return setError("Add a payout account first.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount.");
    if (value > available) return setError(`You can withdraw up to ${naira(available)}.`);
    setError(null);
    onWithdraw(Math.round(value));
    setDone(Math.round(value));
    setAmount("");
  };

  return (
    <section aria-labelledby="withdraw-title" className="border-2 border-line bg-panel p-5">
      <h2 id="withdraw-title" className="font-display text-2xl uppercase text-white">Withdraw</h2>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-200">
            Amount <span className="font-normal text-slate-500">{naira(available)} available</span>
          </span>
          <div className="flex">
            <span className="flex h-11 items-center border-2 border-r-0 border-line bg-ink px-3 font-display text-lg text-slate-400">₦</span>
            <input
              value={amount}
              inputMode="numeric"
              onChange={(e) => {
                setAmount(e.target.value.replace(/\D/g, ""));
                setDone(null);
              }}
              className={`${input} ${error ? "border-sun" : "border-line"}`}
            />
          </div>
          {error && <span className="mt-1.5 block text-xs font-semibold text-sun">{error}</span>}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={available <= 0} className="btn btn-primary px-5 py-2.5 text-sm disabled:opacity-40">
            Request payout
          </button>
          {available > 0 && (
            <button type="button" onClick={() => setAmount(String(available))} className="text-sm font-semibold text-mint hover:underline">
              Withdraw all
            </button>
          )}
        </div>
        {done != null && (
          <p role="status" className="border-2 border-dashed border-line px-3 py-2 text-xs leading-5 text-slate-400">
            {naira(done)} requested. Payouts aren&apos;t connected in this preview, so nothing is sent.
          </p>
        )}
        {available <= 0 && done == null && <p className="text-xs text-slate-500">Nothing to withdraw yet.</p>}
      </form>
    </section>
  );
}
