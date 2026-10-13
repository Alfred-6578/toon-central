import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { ProfileView } from "@/components/account/ProfileView";
import { getCatalogue, getCreatorsDirectory } from "@/lib/api/client";
import { toFollowedCreators } from "@/lib/library";

export const metadata: Metadata = { title: "Your profile | Toon Central", robots: { index: false } };

// The reader's hub. Their saves and follows live in the browser for now, so the page gets the
// catalogue and creators and picks theirs out after it loads.
export default async function MePage() {
  const [comics, creators] = await Promise.all([getCatalogue(), getCreatorsDirectory("popular")]);
  return (
    <AccountPage>
      <ProfileView comics={comics} creators={toFollowedCreators(creators)} />
    </AccountPage>
  );
}
