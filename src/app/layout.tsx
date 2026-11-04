import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import { isLive } from "@/lib/api/config";
import { AccountsProvider } from "@/lib/mockSession";
import { SIGNED_IN_HINT } from "@/lib/session";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Toon Central - Giving Africa a voice",
  description: "Read Mafiki and watch animated shorts from Toon Central originals and independent African creators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the script below may add data-session-hint before React hydrates.
    <html lang="en" data-scroll-behavior="smooth" className={`${anton.variable} ${archivo.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Runs before the page is drawn: a signed-in reader never sees "Sign in / Join now" flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.cookie.split("; ").includes("${SIGNED_IN_HINT}=1")&&document.documentElement.setAttribute("data-session-hint","")`,
          }}
        />
      </head>
      <body className="min-h-full bg-ink text-white">
        <AccountsProvider live={isLive("accounts")} readerActions={isLive("readerActions")}>{children}</AccountsProvider>
      </body>
    </html>
  );
}
