import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The fonts, for the public preview routes.
 *
 * `globals.css` maps Tailwind's tokens onto these — `--font-sans` resolves to
 * `--font-geist-sans` — and those variables only exist where the loader's
 * classes are. They are set on the `(app)` shell, which these routes are
 * deliberately outside of, so the `font-sans` already on the invoice and
 * credit documents pointed at an undefined variable. CSS discards a
 * declaration that is invalid at computed-value time, so the class was
 * present, matched, and did nothing: a customer opening a shared invoice link
 * got the browser's default serif.
 *
 * Declared here rather than on the root `<body>` so only these routes gain
 * them, leaving auth, onboarding and the rest exactly as they were.
 */
export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      {children}
    </div>
  );
}
