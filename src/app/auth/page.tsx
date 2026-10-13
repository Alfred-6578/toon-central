import { redirect } from "next/navigation";
import { authHref } from "@/lib/auth";

export default async function AuthIndex({ searchParams }: PageProps<"/auth">) {
  const next = (await searchParams).next;
  redirect(authHref("signin", Array.isArray(next) ? next[0] : next));
}
