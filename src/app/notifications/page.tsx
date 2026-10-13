import type { Metadata } from "next";
import { NotificationsView } from "@/components/account/NotificationsView";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Notifications | Toon Central", robots: { index: false } };

export default function NotificationsPage() {
  return (
    <AccountPage title="Notifications" width="max-w-3xl">
      <NotificationsView />
    </AccountPage>
  );
}
