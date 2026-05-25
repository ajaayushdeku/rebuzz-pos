import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";

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
  const currencyCode = cookieStore.get("currency")?.value;
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <TooltipProvider delayDuration={200}>
        <Toaster />
        <SidebarProvider>
          <div className="fixed top-0 left-0 right-0 z-50 md:h-(--navbar-height)">
            <Navbar />
          </div>

          <div className="fixed top-(--navbar-height) left-0 bottom-0  z-40 hidden md:block">
            <Sidebar />
          </div>

          <MobileSidebarOverlay />

          <MainContent>
            <QueryProvider>
              <CurrencyProvider initialCurrencyCode={currencyCode}>
                {children}
              </CurrencyProvider>
            </QueryProvider>
          </MainContent>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
