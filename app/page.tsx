import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import InvoiceSs from "@/public/InvoiceScreenshot.png";

const Page = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-6">
        <h1 className="text-blue-950 text-lg md:text-xl font-bold">ReBuzz</h1>

        {token ? (
          <div>
            {/* <Button className="border-0 hover:bg-gray-100 hover:text-blue-600 bg-gray-100 text-blue-900 font-semibold px-4 md:px-8"> */}
            <Button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-8 py-2 md:py-4 font-semibold rounded-3xl">
              <Link href={"/dashboard"}>
                <span className="text-base md:text-lg">Get Back</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-4">
            <Button className="border-0 hover:bg-gray-100 hover:text-blue-600 bg-gray-100 text-blue-900 font-semibold px-4 md:px-8">
              <Link href="/login">
                <span className="text-base md:text-lg">Log in</span>
              </Link>
            </Button>

            <Button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-8 py-3 md:py-6 font-semibold rounded-3xl">
              <Link href="/signup">
                <span className="hidden md:block text-lg">
                  Get started for free
                </span>
                <span className="md:hidden text-base">Sign up</span>
              </Link>
            </Button>
          </div>
        )}
      </nav>

      {/* BODY */}
      <div className="flex flex-col items-center text-center px-6 md:px-16 space-y-4 pb-16">
        <h2 className="text-blue-900 font-semibold text-sm md:text-base tracking-wide">
          SIMPLE MONEY MANAGEMENT SOLUTION
        </h2>

        <h1 className="text-blue-900 text-3xl sm:text-4xl md:text-5xl font-semibold max-w-2xl">
          Manage your money like a boss
        </h1>

        <p className="text-blue-900 text-base md:text-xl max-w-xl md:max-w-2xl">
          Rebuzz lets small business owners like you create beautiful invoices,
          accept online payments, and make accounting easy — all in one place.
        </p>

        <Button className="bg-orange-500 hover:bg-orange-600 px-8 py-6 text-blue-900 text-base md:text-lg font-semibold rounded-3xl">
          <Link href="/signup">Get started for free</Link>
        </Button>

        <div className="w-full max-w-4xl rounded-xl shadow-sm overflow-hidden mt-4">
          <Image
            src={InvoiceSs}
            placeholder="blur"
            quality={80}
            width={800}
            alt="Screenshot of rebuzz app"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
