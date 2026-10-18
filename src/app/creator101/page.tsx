import { redirect } from "next/navigation";

// The live site's Creator101 guide lives at /milestones here; old links land on it.
export default function Creator101Page() {
  redirect("/milestones");
}
