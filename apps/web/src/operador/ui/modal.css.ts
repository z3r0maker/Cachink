import { keyframes, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

const pop = keyframes({
  from: { opacity: 0, transform: 'translateY(10px) scale(0.98)' },
  to: { opacity: 1, transform: 'none' },
});

const fade = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

/**
 * Every operator modal (README «Modales»): the scrim, the card pinned to the
 * top with 16 px around it and a scrolling body — centring would leave the
 * header unreachable on short screens.
 *
 * The close animation is not decoration: Radix keeps the portal mounted while
 * it plays, so the scrim still covers the screen — a smashed confirm button
 * cannot leak clicks onto the catalogue behind the closing card.
 */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'grid',
  placeItems: 'start center',
  padding: 16,
  overflowY: 'auto',
  background: colors.scrim,
  selectors: {
    '&[data-state="closed"]': { animation: `${fade} 160ms ease-out forwards` },
  },
});

export const card = style({
  width: '100%',
  maxHeight: 'calc(100vh - 32px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[6],
  background: colors.white,
  boxShadow: shadows.hero,
  animation: `${pop} 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const head = style({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  borderBottom: `2.5px solid ${colors.black}`,
});

/** Radix renders the title as an `<h2>`; the design's is a span with no margin. */
export const title = style({
  margin: 0,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

/** The head's square buttons (close, back): 32 px in most files, 34 in Cobrar. */
export const square = style({
  boxSizing: 'content-box',
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.white,
  color: colors.black,
  cursor: 'pointer',
});

export const body = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  fontSize: portalFontSizes.md,
});
