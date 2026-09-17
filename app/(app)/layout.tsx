import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";

import { ACCESS_DENIED_PATH } from "@/lib/auth/roles";
import { isDeniedSession } from "@/lib/auth/verifyAdmin";

import { QueryProvider } from "@/providers/QueryProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/providers/CurrencyContext";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import MobileSidebarOverlay from "@/components/layout/MobileSidebarOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoices",
  description: "Track your sales",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  // The authoritative half of the role gate. The middleware turns away any
  // session whose role cookie says staff, but that cookie is written by this
  // app and so can be edited in a browser; the token cannot be. This asks the
  // backend who the token belongs to, and wraps every page under (app).
  const token = cookieStore.get("token")?.value;
  if (token && (await isDeniedSession(token))) {
    redirect(ACCESS_DENIED_PATH);
  }

  const currencyCode = cookieStore.get("currency")?.value;

  /*
   * The shell is exactly the viewport and does not scroll: the navbar and the
   * sidebar are fixed, and `MainContent` scrolls inside it. The window then
   * has no scrollbar to lose when a modal locks the page — losing it was
   * shifting the whole layout sideways as the gutter vanished.
   *
   * Scoped to this shell rather than set on `html`/`body`, which the preview,
   * auth and onboarding routes share and still want to scroll normally.
   */
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased h-dvh overflow-hidden`}
    >
      <TooltipProvider delayDuration={200}>
        <Toaster />
        {/*
         * One query cache for the navbar, the sidebar and the pages.
         *
         * It used to wrap the page area alone, so the shell read the root
         * layout's separate cache instead. Anything saved on a page then never
         * reached the shell: saving an AI key refreshed the settings page's
         * copy of the key status while the sidebar kept its own stale one.
         *
         * Still scoped to this layout rather than lifted to the root. Login
         * returns here by client navigation, not a reload, so this client
         * being discarded when the app shell unmounts is what keeps one
         * account's cached data from showing to the next.
         */}
        <QueryProvider>
          <SidebarProvider>
            <div className="fixed top-0 left-0 right-0 z-50 md:h-(--navbar-height)">
              <Navbar />
            </div>

            <div className="fixed top-(--navbar-height) left-0 bottom-0  z-40 hidden md:block">
              <Sidebar />
            </div>

            <MobileSidebarOverlay />

            <MainContent>
              <CurrencyProvider initialCurrencyCode={currencyCode}>
                {children}
              </CurrencyProvider>
            </MainContent>
          </SidebarProvider>
        </QueryProvider>
      </TooltipProvider>
    </div>
  );
}
