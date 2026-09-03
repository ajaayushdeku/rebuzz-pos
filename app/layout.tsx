import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { cookies } from "next/headers";
import { CurrencyProvider } from "@/providers/CurrencyContext";

/*
 * The fonts, for every route at once — commented out on purpose.
 *
 * `globals.css` maps Tailwind's tokens onto these: `--font-sans` resolves to
 * `--font-geist-sans`, which exists only where the loader's class is. That
 * class sits on the `(app)` shell, so anywhere outside it — the public
 * `/preview` documents, auth, onboarding — `font-sans` points at an undefined
 * variable, and CSS discards a declaration that is invalid at computed-value
 * time. The class matches, applies, and does nothing, leaving the browser's
 * default serif.
 *
 * Uncommenting these two blocks fixes it everywhere in one place, and makes
 * `app/preview/layout.tsx` (which carries the same loaders for the preview
 * routes alone) redundant. Left off for now because it changes the typeface
 * on every page outside the app shell at once, which is a bigger visual
 * change than the preview pages needed.
 */
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - Rebuzz",
    default: "Rebuzz POS",
  },
  description: "Track your sales",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency")?.value;
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        {/* <body> */}
        <QueryProvider>
          <CurrencyProvider initialCurrencyCode={currencyCode}>
            <div>{children}</div>
          </CurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
