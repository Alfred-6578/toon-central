import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { NotificationReader } from "@/components/notifications/NotificationReader";

export const metadata: Metadata = { title: "Notification | Toon Central", robots: { index: false } };

export default async function NotificationPage({ params }: PageProps<"/notifications/[id]">) {
  const { id } = await params;
  return (
    <AccountPage width="max-w-3xl">
      <NotificationReader id={id} />
    </AccountPage>
  );
}
