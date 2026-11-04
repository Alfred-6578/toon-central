import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { SettingsView } from "@/components/account/SettingsView";
import { getMobileOperators } from "@/lib/api/account";
import { isLive } from "@/lib/api/config";

export const metadata: Metadata = { title: "Settings | Toon Central", robots: { index: false } };

export default async function SettingsPage() {
  const live = isLive("accounts");
  return (
    <AccountPage title="Settings" width="max-w-5xl">
      <SettingsView live={live} operators={live ? await getMobileOperators() : []} />
    </AccountPage>
  );
}
