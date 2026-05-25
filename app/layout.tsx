import type { Metadata } from "next";

import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { cookies } from "next/headers";
import { CurrencyProvider } from "@/providers/CurrencyContext";

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
      <body>
        <QueryProvider>
          <CurrencyProvider initialCurrencyCode={currencyCode}>
            <div>{children}</div>
          </CurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
