import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import { Providers } from "./Providers";
import "./globals.css";

// Open substitute for the reference's proprietary magicaCircular (DEC-028), exposed as --font-body.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = { title: "Agent Chat" };

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
