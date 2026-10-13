import { InkLogoLoader } from "@/components/ui/Loaders";

// Shown while a page is being prepared (first load or a slow page change). It only fades in after a
// short delay, so fast page changes never flash it.
export default function Loading() {
  return <InkLogoLoader className="min-h-dvh" />;
}
