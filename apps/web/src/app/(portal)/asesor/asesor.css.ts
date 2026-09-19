import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const pageSubtitle = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const feedRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  padding: '16px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const feedTile = style({
  width: 40,
  height: 40,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
});

export const feedTitle = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const feedBody = style({
  marginTop: 4,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

/**
 * The provenance footer.
 *
 * Deterministic output says "Calculado"; only model-written text may say
 * "Generado con IA" (ADR-059). Getting this backwards would be a false claim in
 * either direction.
 */
export const provenance = style({
  marginTop: 14,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const capRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const capName = style({ fontWeight: typography.weights.extraBold, color: colors.black });

export const capReq = style({
  marginTop: 2,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const barTrack = style({
  width: 120,
  height: 12,
  flex: 'none',
  background: colors.gray100,
  border: `2px solid ${colors.black}`,
  borderRadius: radii[0],
  overflow: 'hidden',
});

export const barFill = style({ display: 'block', height: '100%' });

export const goalFigure = style({
  margin: '10px 0 0',
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const feedLink = style({
  color: 'inherit',
  textDecoration: 'none',
});
