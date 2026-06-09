// import Link from "next/link";
// import Image from "next/image";
// import { cookies } from "next/headers";

// import { Button } from "@/components/ui/button";
// import InvoiceSs from "@/public/InvoiceScreenshot.png";

// const Page = async () => {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* NAVBAR */}
//       <nav className="flex items-center justify-between px-6 md:px-16 py-6">
//         <h1 className="text-blue-950 text-lg md:text-xl font-bold">ReBuzz</h1>

//         {token ? (
//           <div>
//             {/* <Button className="border-0 hover:bg-gray-100 hover:text-blue-600 bg-gray-100 text-blue-900 font-semibold px-4 md:px-8"> */}
//             <Button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-8 py-2 md:py-4 font-semibold rounded-3xl">
//               <Link href={"/dashboard"}>
//                 <span className="text-base md:text-lg">Get Back</span>
//               </Link>
//             </Button>
//           </div>
//         ) : (
//           <div className="flex items-center gap-2 md:gap-4">
//             <Button className="border-0 hover:bg-gray-100 hover:text-blue-600 bg-gray-100 text-blue-900 font-semibold px-4 md:px-8">
//               <Link href="/login">
//                 <span className="text-base md:text-lg">Log in</span>
//               </Link>
//             </Button>

//             <Button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-8 py-3 md:py-6 font-semibold rounded-3xl">
//               <Link href="/signup">
//                 <span className="hidden md:block text-lg">
//                   Get started for free
//                 </span>
//                 <span className="md:hidden text-base">Sign up</span>
//               </Link>
//             </Button>
//           </div>
//         )}
//       </nav>

//       {/* BODY */}
//       <div className="flex flex-col items-center text-center px-6 md:px-16 space-y-4 pb-16">
//         <h2 className="text-blue-900 font-semibold text-sm md:text-base tracking-wide">
//           SIMPLE MONEY MANAGEMENT SOLUTION
//         </h2>

//         <h1 className="text-blue-900 text-3xl sm:text-4xl md:text-5xl font-semibold max-w-2xl">
//           Manage your money like a boss
//         </h1>

//         <p className="text-blue-900 text-base md:text-xl max-w-xl md:max-w-2xl">
//           Rebuzz lets small business owners like you create beautiful invoices,
//           accept online payments, and make accounting easy — all in one place.
//         </p>

//         <Button className="bg-orange-500 hover:bg-orange-600 px-8 py-6 text-blue-900 text-base md:text-lg font-semibold rounded-3xl">
//           <Link href="/signup">Get started for free</Link>
//         </Button>

//         <div className="w-full max-w-4xl rounded-xl shadow-sm overflow-hidden mt-4">
//           <Image
//             src={InvoiceSs}
//             placeholder="blur"
//             quality={80}
//             width={800}
//             alt="Screenshot of rebuzz app"
//             className="w-full h-auto"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Page;

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import InvoiceSs from "@/public/InvoiceScreenshot.png";
import {
  BarChart3,
  Receipt,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Receipt,
    title: "Smart Invoicing",
    description:
      "Create professional invoices in seconds with automatic tax and discount calculations.",
  },
  {
    icon: CreditCard,
    title: "Online Payments",
    description:
      "Accept cash, card, and QR payments seamlessly. All tracked in one place.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track sales, profit margins, and staff performance with live dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description:
      "Your data is encrypted and backed up automatically, always available when you need it.",
  },
];

const HIGHLIGHTS = [
  "No setup fees — free to get started",
  "Works on any device",
  "Nepal-ready with NPR support",
  "Inventory & stock tracking",
];

const Page = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 md:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-gray-900 text-lg font-bold tracking-tight">
            ReBuzz
          </span>
        </div>

        {token ? (
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-sm font-semibold"
          >
            <Link href="/dashboard" className="flex items-center gap-1.5">
              Go to Dashboard
              <ArrowRight size={14} />
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              asChild
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-4 py-2 text-sm font-medium"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 md:px-5 py-2 text-sm font-semibold"
            >
              <Link href="/signup">
                <span className="hidden sm:inline">Get started free</span>
                <span className="sm:hidden">Sign up</span>
              </Link>
            </Button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 md:px-16 pt-16 md:pt-24 pb-12 text-center max-w-5xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
          <Zap size={11} />
          Built for Nepal&lsquo;s businesses
        </span>

        <h1 className="text-gray-900 text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight max-w-3xl mx-auto">
          Run your business <span className="text-blue-600">smarter</span>, not
          harder
        </h1>

        <p className="text-gray-500 text-base md:text-lg mt-5 max-w-xl mx-auto leading-relaxed">
          Rebuzz POS helps small business owners create invoices, track
          inventory, accept payments, and understand their numbers — all in one
          clean dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-7 py-3 text-base font-semibold w-full sm:w-auto"
          >
            <Link href="/signup" className="flex items-center gap-2">
              Start for free
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-7 py-3 text-base font-medium w-full sm:w-auto"
          >
            <Link href="/login">Sign in to your account</Link>
          </Button>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item}
              className="flex items-center gap-1.5 text-sm text-gray-500"
            >
              <CheckCircle2 size={13} className="text-green-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── App screenshot ── */}
      <section className="px-6 md:px-16 pb-16 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden ring-1 ring-gray-100">
          <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-1.5 border-b border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400 ml-2">rebuzzpos.com</span>
          </div>
          <Image
            src={InvoiceSs}
            placeholder="blur"
            quality={85}
            width={1000}
            alt="Rebuzz POS dashboard screenshot"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 border-t border-gray-100 px-6 md:px-16 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 text-2xl md:text-3xl font-bold">
              Everything you need to grow
            </h2>
            <p className="text-gray-500 mt-3 text-sm md:text-base max-w-lg mx-auto">
              A complete toolkit for managing sales, staff, customers, and
              inventory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1.5">
                  {title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 md:px-16 py-16 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-gray-900 text-2xl md:text-3xl font-bold">
            Ready to simplify your business?
          </h2>
          <p className="text-gray-500 mt-3 text-sm md:text-base">
            Join businesses already using Rebuzz POS to save time and grow
            faster.
          </p>
          <Button
            asChild
            className="mt-7 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-3 text-base font-semibold"
          >
            <Link href="/signup" className="flex items-center gap-2">
              Get started for free
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 md:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
            <Zap size={10} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            ReBuzz POS
          </span>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} ReBuzz. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Page;
