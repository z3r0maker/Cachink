import { style, styleVariants } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** Notices, status pills and Don's one tip on the first-day screens. */
export const aviso = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 10px 10px 16px',
  borderRadius: radii[4],
  border: '2px solid currentColor',
});

export const avisoTono = styleVariants({
  success: { background: colors.greenSoft, color: colors.greenText },
  warning: { background: colors.warningSoft, color: colors.warningText },
  info: { background: colors.blueSoft, color: colors.blueText },
  critical: { background: colors.redSoft, color: colors.redText },
});

export const avisoTexto = style({
  flex: 1,
  minWidth: 0,
  padding: '4px 0',
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const avisoCerrar = style({
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: 0,
  borderRadius: radii[2],
  background: 'none',
  color: colors.black,
  cursor: 'pointer',
  selectors: { '&:hover': { background: colors.white } },
});

export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 16px',
  borderRadius: shapeRadii.pill,
  border: '2px solid currentColor',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const pillTexto = style({ color: colors.black });

export const donTip = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: radii[5],
  background: colors.yellowSoft,
});

export const donTipTexto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});
