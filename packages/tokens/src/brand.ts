/**
 * Brand lockup measurements.
 *
 * These are deliberately **not** on the type ramp. The wordmark is set in
 * Anton — a display face used for the lockup and nothing else — so its size is
 * a property of the mark, not of the UI type scale, exactly as `emojiSizes`
 * is a property of an illustration rather than of running text.
 *
 * Keeping them here rather than as literals means `design-lint` stops flagging
 * them, and a future change to the lockup happens in one place.
 */
export const brand = {
  /** Coin diameter in the sidebar brand block. */
  coinSidebar: 38,
  /** Wordmark size beside it. */
  wordmarkSidebar: 23,
  /** Wordmark line-height; the mark sits tight. */
  wordmarkLineHeight: 0.92,
  /** Tracking on the wordmark. */
  wordmarkTracking: '-0.005em',
  /** Stroke width of the X inside the coin, on a 24×24 viewBox. */
  coinStrokeWidth: 4.6,
} as const;
