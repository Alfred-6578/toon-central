import { redirect } from "next/navigation";

// The live site's upload URL (and our Publish menu's) opens the Studio's short uploader.
export default function ShortsUploadRedirect() {
  redirect("/creator/shorts/new");
}
