import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";

import { Providers } from "./Providers";
import "./globals.css";

// Open substitute for the reference's proprietary magicaCircular (DEC-028), exposed as --font-body.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

// The reference's name and favicon (src/app/favicon.ico), at the user's request.
export const metadata: Metadata = { title: "Magica" };

// maximumScale, as the reference does: iOS Safari zooms into a focused field under 16px (our
// composer is 14px), pushing the composer and the end of the thread off-screen; pinch zoom still
// works. resizes-content: the on-screen keyboard shrinks the h-dvh shell, so the composer stays
// above it and the thread can still scroll to its last message (Android Chrome).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html> before React hydrates.
    <html lang="en" className={`${figtree.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* Inside <body>, not around <html>: required with Next 16 cacheComponents (Clerk Core 3). */}
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
