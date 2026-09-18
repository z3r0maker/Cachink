import { keyframes, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../styles/press.css';

/**
 * `Operador Estado` — the operator's three non-happy states, one card shape.
 *
 * Every value is read from `design-reference/operador/Operador Estado.dc.html`.
 *
 * The design sizes fixed boxes content-box (a 62 px tile with a 2.5 px border
 * renders 67 px), while the portal's reset is border-box. `contentBox` restores
 * the file's geometry wherever it gives an explicit width or height.
 */
const contentBox = { boxSizing: 'content-box' } as const;
const card = {
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
} as const;

const centred = style({
  ...card,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  textAlign: 'center',
});

export const emptyCard = style([centred, { padding: '52px 24px', background: colors.white }]);
export const errorCard = style([centred, { padding: '44px 24px', background: colors.redSoft }]);

const tileBase = style({
  ...contentBox,
  width: 62,
  height: 62,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
});
export const tileEmpty = style([tileBase, { background: colors.yellowSoft, color: colors.black }]);
export const tileError = style([tileBase, { background: colors.white, color: colors.redText }]);

export const title = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  textWrap: 'pretty',
});

const bodyBase = style({
  maxWidth: 440,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  textWrap: 'pretty',
});
export const bodyEmpty = style([bodyBase, { color: colors.gray600 }]);
export const bodyError = style([bodyBase, { color: colors.ink }]);

const actionBase = style([
  pressable,
  {
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    height: 52,
    padding: '0 22px',
    border: `2.5px solid ${colors.black}`,
    borderRadius: radii[3],
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.black,
    textDecoration: 'none',
  },
]);
/** The empty CTA is an `<a>` (content-box: 52 + borders); the retry is a
 *  `<button>`, which browsers size border-box even in the design file. */
export const actionYellow = style([actionBase, { ...contentBox, background: colors.yellow }]);
export const actionWhite = style([actionBase, { background: colors.white }]);

/* Loading: a header with a pulsing dot and five static skeleton rows. */
export const loadingCard = style({ ...card, background: colors.white, overflow: 'hidden' });

export const loadingHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  background: colors.gray100,
  borderBottom: `2.5px solid ${colors.black}`,
});

const pulse = keyframes({ '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.45 } });

export const dot = style({
  ...contentBox,
  width: 16,
  height: 16,
  border: `2px solid ${colors.black}`,
  borderRadius: 9999,
  background: colors.yellow,
  animation: `${pulse} 1.1s ease-in-out infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const loadingLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '16px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const rowTile = style({
  ...contentBox,
  flex: 'none',
  width: 42,
  height: 42,
  border: `2px solid ${colors.gray200}`,
  borderRadius: radii[2],
  background: colors.gray100,
});

const bar = { height: 16, borderRadius: radii[0], background: colors.gray100 } as const;
export const rowBar = style({ ...bar, flex: 1, minWidth: 0 });
export const rowBarShort = style({ ...bar, flex: 'none', width: 84 });
