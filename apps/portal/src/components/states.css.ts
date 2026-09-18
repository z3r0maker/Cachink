import { style } from '@vanilla-extract/css';
import { colors, fontSizes, radii, shadows, typography } from '@xangarro/tokens';

/**
 * The four data states, as one shape.
 *
 * `empty` and `error` share a centred card; only the tile colour and the call
 * to action differ. `loading` is a static grey block — **never** a shimmer and
 * never a spinner (design handoff, "The four data states").
 */
export const stateCard = style({
  background: colors.white,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
  padding: '64px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

export const tile = style({
  width: 76,
  height: 76,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[5],
  boxShadow: shadows.card,
  marginBottom: 20,
});

export const tileEmpty = style({ background: colors.yellowSoft, color: colors.black });
export const tileError = style({ background: colors.redSoft, color: colors.redText });

export const stateTitle = style({
  margin: 0,
  fontSize: fontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const stateBody = style({
  margin: '8px 0 0',
  maxWidth: '46ch',
  fontSize: fontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

export const stateAction = style({ marginTop: 22 });

/** Loading: the real borders and shadows, filled with grey. No shimmer. */
export const loadingBlock = style({
  background: colors.gray100,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[4],
  boxShadow: shadows.card,
});

export const loadingLabel = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
});
