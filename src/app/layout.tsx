import type { Metadata, Viewport } from "next";
import "./globals.css";

// Section 10.4 of the master build prompt: the font stack must cover
// Devanagari cleanly since Hindi and English mix throughout the UI in the
// same screens. Self-hosted via @fontsource (not next/font/google) because
// this sandbox's network can't reach fonts.googleapis.com — self-hosting
// also means the production build no longer depends on that connection at
// all, wherever it's eventually deployed. Only the weights actually used in
// the UI (400 regular, 700 for font-bold) are imported.
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/700.css";

export const metadata: Metadata = {
  title: "Central Panchayat Rojgar Setu",
  description:
    "Pujya Sindhi Central Panchayat Bilaspur's free, non-commercial community employment-matching platform.",
};

// The site never sets data-theme="dark" (see globals.css) and has no
// light/dark toggle, so it should always render as the light palette — but
// without explicitly declaring that here, some Android phones' "force dark
// for web content" browser setting still auto-repaints the page dark on top
// of our own colors, and gets individual elements wrong (a user reported
// dashboard text rendering in unreadable black). `colorScheme: "light"`
// tells the browser this page only supports light mode, which makes Chrome
// / most Android WebViews skip that forced-dark repaint entirely.
export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
