import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Access denied",
};

/**
 * Where a non-admin lands.
 *
 * Deliberately outside `(app)`: that layout draws the navbar and sidebar, and
 * runs its own role check, which would send anyone who got here straight back.
 * This page has no chrome and reads no session.
 *
 * The wording says the account is not permitted rather than that the sign-in
 * failed — the password was right, and telling someone their credentials were
 * wrong would send them round the login form for no reason.
 */
export default function AccessDeniedPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white font-sans">
      {/* Two washes behind the page, warm rather than the app's blue, so the
          screen reads as a stop before a word of it has been read. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-red-100/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-32 h-[36rem] w-[36rem] rounded-full bg-orange-100/50 blur-3xl"
      />

      <header className="relative px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/rebuzz.png"
            alt=""
            width={34}
            height={34}
            className="rounded-lg"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            ReBuzz
          </span>
        </Link>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div
          aria-hidden
          className="relative mb-10 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
        >
          <span className="absolute inset-4 rounded-full bg-red-400/20 animate-ping motion-reduce:animate-none" />
          <span className="absolute inset-8 rounded-full bg-red-400/25 animate-ping [animation-delay:500ms] [animation-duration:3s] motion-reduce:animate-none" />
          <span className="absolute inset-10 rounded-full bg-white shadow-sm" />

          <ShieldAlert
            className="relative h-20 w-20 text-red-500 sm:h-24 sm:w-24"
            strokeWidth={1.5}
          />

          {/* A second mark on the shield, offset so the two read as one badge */}
          <span className="absolute bottom-9 right-9 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 shadow-md animate-pulse motion-reduce:animate-none">
            <Lock size={16} className="text-white" strokeWidth={2.5} />
          </span>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
          Access denied
        </p>

        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
          This account can&rsquo;t open the POS
        </h1>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-500">
          Your details were correct, but only administrator accounts are allowed
          to sign in here. Nothing has been changed on your account.
        </p>

        <Link
          href="/"
          className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to home
        </Link>

        <p className="mt-6 max-w-sm text-xs leading-relaxed text-gray-400">
          Think this is a mistake? Ask the business owner to check the role set
          on your account.
        </p>
      </main>
    </div>
  );
}
