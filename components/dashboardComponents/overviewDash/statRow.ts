/**
 * The dashboard's stat rows: a swipeable carousel on a phone, a grid from `sm`.
 *
 * Both rows at the top of the overview — the four stat boxes and the four
 * winning stats — are the same shape, and the skeletons that stand in for them
 * have to be that shape too or the page jumps when the data lands. So the
 * classes live here once rather than in four hand-copied strings, which is how
 * one of them ended up shipping a `bg-cyan-400` debug tint and a stray
 * `grid-cols-4` that applied at every width.
 *
 * Why a carousel below `sm` at all: the row was two columns on a phone, which
 * halves the width a figure like "Rs 1,24,500" has to sit in and stacks four
 * cards into two tall rows before the charts get a look in. One swipeable line
 * keeps the first card full-size and the rest a flick away.
 */

/**
 * The row itself.
 *
 * - `-mx-6 px-6` makes it full-bleed against the dashboard's own `px-6`, so a
 *   card runs to the edge of the screen instead of stopping short of it. That
 *   edge is the only thing telling you the row scrolls, and padding alone would
 *   hide it. Undone from `sm` up, where the row is a grid again.
 * - `scroll-pl-6` is not decoration. Snapping aligns to the scrollport's
 *   padding box, which `-mx-6` has pushed out to the screen edge — without it
 *   every snap would yank the card flush to the edge, 24px past where it rests
 *   at scroll 0.
 * - `items-start` in both modes: a grid stretches every cell to the tallest in
 *   its row, so expanding one card silently grew its neighbours too — they
 *   gained the height with nothing to put in it.
 * - `scrollbar-custom` rather than `scrollbar-hide`: the app shell hides its own
 *   scrollbar, so a row that scrolls sideways inside it has to say so itself.
 */
export const STAT_ROW = [
  "flex items-start gap-3 -mx-6 snap-x snap-mandatory overflow-x-auto scroll-pl-6 px-6  scrollbar-hide",
  "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-2 sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0",
  "md:gap-3 lg:grid-cols-4",
].join(" ");

/**
 * One card in it.
 *
 * A share of the screen rather than a fixed 280px: on a 320px phone a 280px
 * card is wider than the space left after the page's padding, so nothing of the
 * next one shows and the row looks like it ends there. `max-w` caps it for the
 * tablet widths that are still below `sm`, where 72% would be 420px of card.
 */
export const STAT_ROW_ITEM =
  "w-[72%] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none";
