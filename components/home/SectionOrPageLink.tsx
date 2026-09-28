import Link from "next/link";

/**
 * A link to a section of this page, or to another page.
 *
 * The hash ones are plain anchors on purpose. The page scrolls inside its own
 * container now, and `next/link` scrolls the document — which no longer
 * moves — so a Link to "#about" would go nowhere. A native anchor scrolls
 * the nearest scrollable ancestor, which is the page.
 */
export function SectionOrPageLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return href.startsWith("#") ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
