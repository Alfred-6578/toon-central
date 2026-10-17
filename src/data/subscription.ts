// Plans, passes and credit packs as listed on the live site's subscription page
// (tooncentralhub.com/subscription, checked 2026-10-13). The live site loads them from its backend;
// when TOON_API_BASE_URL is connected these should come from there instead of this file.

export type Plan = {
  id: string;
  name: string;
  // Naira.
  price: number;
  period: "month" | "year" | "week" | "day";
  blurb?: string;
  features: string[];
  // Highlights one option, as the live site does ("Best value" on Daily Access).
  badge?: string;
  // A price we suggested that the client hasn't confirmed; stamped "Proposed price" on the page.
  proposed?: boolean;
};

export type CreditPack = { id: string; credits: number; price: number };

// Monthly tiers.
export const PLANS: Plan[] = [
  { id: "free", name: "Free", price: 0, period: "month", blurb: "For readers new to Toon Central", features: ["Access to Toon Central"] },
  {
    id: "basic",
    name: "Basic",
    price: 950,
    period: "month",
    features: ["Access to Toon Central", "190 free credits monthly", "Hide ads", "Episode discounts"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 1550,
    period: "month",
    features: ["Everything in Basic", "310 free credits monthly", "Download comics to read offline"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 3000,
    period: "month",
    features: ["Everything in Basic", "600 free credits monthly", "Membership of Toon Central's creative community"],
  },
];

// Yearly billing isn't on the live site yet. Proposed: pay for 10 months, get 12 ("2 months free").
// Unconfirmed, so every yearly price is stamped. Replace with the client's prices when they exist.
const MONTHS_CHARGED_PER_YEAR = 10;

export const YEARLY_PLANS: Plan[] = PLANS.map((plan) =>
  plan.price === 0
    ? { ...plan, period: "year" }
    : { ...plan, period: "year", price: plan.price * MONTHS_CHARGED_PER_YEAR, proposed: true }
);

export const YEARLY_SAVING = "2 months free";

// "Special offers": short passes that unlock everything. (The live site says "All comics & series
// included"; written "every comic" here because Series isn't a medium on the site yet.)
const PASS_FEATURES = ["Access to all locked panels and chapters", "Every comic included", "Ad-free reading"];

export const PASSES: Plan[] = [
  { id: "daily", name: "Daily Access", price: 100, period: "day", blurb: "Daily access to Toon Central content", features: PASS_FEATURES, badge: "Best value" },
  { id: "weekly", name: "Weekly Access", price: 500, period: "week", blurb: "Weekly access to Toon Central content", features: PASS_FEATURES },
];

export const PASS_TERMS = (period: Plan["period"]) =>
  `Auto-renews ${period === "day" ? "daily" : "weekly"} until you cancel. Manage or cancel any time.`;

export const CREDIT_PACKS: CreditPack[] = [
  { id: "credits-10", credits: 10, price: 50 },
  { id: "credits-50", credits: 50, price: 250 },
  { id: "credits-100", credits: 100, price: 500 },
  { id: "credits-500", credits: 500, price: 2500 },
  { id: "credits-1000", credits: 1000, price: 5000 },
];

export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
