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

// export const metadata: Metadata = {
//   title: {
//     template: "%s - Rebuzz",
//     default: "Rebuzz POS",
//   },
//   description: "Track your sales",
// };

export const metadata: Metadata = {
  metadataBase: new URL("https://manager.rebuzzpos.com"),

  title:
    "Manager Rebuzz POS | Smart POS, Billing & Inventory Management Software",

  description:
    "Manage your business with Rebuzz POS. Simplify billing, inventory management, sales tracking, employee management and business operations with one powerful platform.",

  applicationName: "Rebuzz POS",

  keywords: [
    "POS software",
    "point of sale software",
    "billing software",
    "inventory management software",
    "retail POS software",
    "restaurant POS software",
    "sales management software",
    "Rebuzz POS",
  ],

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rebuzz POS",
    title: "Rebuzz POS | Smart POS, Billing & Inventory Management Software",
    description:
      "Simplify billing, inventory management and business operations with Rebuzz POS.",
    url: "https://manager.rebuzzpos.com",
    images: ["/og-image.png"],
  },

  twitter: {
    card: "summary_large_image",
    title: "Rebuzz POS | Smart POS Software",
    description: "Manage billing, inventory and sales with Rebuzz POS.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency")?.value;
  const savedTheme = cookieStore.get("rebuzz-theme")?.value;
  return (
    <html
      lang="en"
      className={savedTheme === "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <head>
        {/*
         * The theme, before the first paint.
         *
         * It runs blocking in <head> on purpose: anything that decides this
         * after React hydrates shows a white page first and then corrects
         * itself. `suppressHydrationWarning` above is because this script
         * changes the class the server rendered, which is the point.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=null;try{var m=document.cookie.match(/(?:^|;\\s*)rebuzz-theme=(dark|light)(?:;|$)/);s=m?m[1]:localStorage.getItem("rebuzz-theme")}catch(e){try{s=localStorage.getItem("rebuzz-theme")}catch(e){}}var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)})()`,
          }}
        />
      </head>
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
