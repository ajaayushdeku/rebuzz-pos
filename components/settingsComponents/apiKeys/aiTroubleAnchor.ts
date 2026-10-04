/**
 * The id the help note carries and the header button jumps to.
 *
 * Its own module so the two agree by import rather than by both spelling the
 * same string — a renamed id that only one side hears about is a button that
 * silently does nothing. Kept out of either component so the static note is not
 * pulled into the client bundle just to share a constant.
 */
export const AI_TROUBLE_SECTION_ID = "ai-not-answering";
