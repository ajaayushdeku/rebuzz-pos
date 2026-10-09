/**
 * The shared demo login.
 *
 * One account that anyone evaluating Rebuzz signs into, so what it shows has to
 * stay as it was set up: whatever one visitor changes, the next visitor sees.
 * The business profile is the clearest case — it is printed on every invoice and
 * receipt in the demo — so this account can read it but not rewrite it.
 *
 * Kept free of any Next.js import so a client component, a route handler and
 * the edge middleware can all use the same answer.
 */

/**
 * The demo account's phone number, which doubles as its login id.
 *
 * The phone rather than the email or the id: it is what the demo signs in with,
 * and `/business/users/me` returns it on every profile read, so both the screen
 * and the API can recognise the account without a lookup table.
 */
export const DEMO_ACCOUNT_PHONE = "0123456789";

/**
 * True when this phone number belongs to the demo account.
 *
 * Compared on digits alone, because the same number reaches this from a few
 * directions — a profile read, a login form, a stored account — and one of them
 * spacing it or hyphenating it should not quietly turn the demo into a normal
 * business with edit rights. The country code is a separate field on the
 * profile, so it is not stripped here: a real `+977 0123456789` normalises to
 * something longer and does not match.
 */
export function isDemoPhone(phone: string | null | undefined): boolean {
  if (typeof phone !== "string") return false;
  return phone.replace(/\D/g, "") === DEMO_ACCOUNT_PHONE;
}

/**
 * Why the demo cannot edit, in the words the visitor sees.
 *
 * Here beside the rule so the disabled button, the page's own explanation and
 * the API's refusal all say the same thing.
 */
export const DEMO_EDIT_LOCKED_REASON =
  "This is the shared demo account, so the business profile is fixed — everyone exploring Rebuzz sees the same details. Sign in to your own account to edit them.";
