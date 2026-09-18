import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../../shell/shell.css';

/** Operador · Detalle de venta (`Operador Detalle de venta.dc.html`): the ticket card. */
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
  gap: 18,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1059px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const head = style({
  padding: 20,
  borderBottom: `2.5px solid ${colors.black}`,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
});

export const total = style({
  marginTop: 8,
  fontSize: portalFontSizes.price,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.display } },
});

export const when = style({
  marginTop: 8,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const cancelBox = style({
  flex: 'none',
  maxWidth: 280,
  padding: '12px 14px',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
  background: colors.white,
});

export const cancelLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.redText,
});

export const cancelMotivo = style({
  marginTop: 4,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const line = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '13px 20px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const qty = style({
  flex: 'none',
  minWidth: 34,
  height: 34,
  padding: '0 9px',
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const lineName = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.015em',
  color: colors.black,
  textWrap: 'pretty',
});

export const lineEach = style({
  marginTop: 2,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const figure = style({
  flex: 'none',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const resumen = style({
  padding: '16px 20px 20px',
  borderTop: `2.5px solid ${colors.black}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
});

export const resumenRow = style({ display: 'flex', alignItems: 'baseline', gap: 10 });

export const resumenLabel = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  selectors: { '&[data-total]': { color: colors.black } },
});
