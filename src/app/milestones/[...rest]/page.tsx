import { redirect } from "next/navigation";

// Old /milestones/<tab> links land on the same Creator 101 tab.
export default async function MilestonesTabPage({ params }: PageProps<"/milestones/[...rest]">) {
  const { rest } = await params;
  redirect(`/creator101/${rest.map(encodeURIComponent).join("/")}`);
}
