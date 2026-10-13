import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { SettingsView } from "@/components/account/SettingsView";

export const metadata: Metadata = { title: "Settings | Toon Central", robots: { index: false } };

export default function SettingsPage() {
  return (
    <AccountPage title="Settings" width="max-w-5xl">
      <SettingsView />
    </AccountPage>
  );
}
