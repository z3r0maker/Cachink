import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** The closed turno's corte, printed like a ticket: header, figures, the difference. */
export const corte = style({
  display: 'flex',
  flexDirection: 'column',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: shadows.hero,
  overflow: 'hidden',
});

export const cabeza = style({
  padding: '20px 24px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const fecha = style({
  marginLeft: 'auto',
  padding: '2px 9px',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
});

export const negocio = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

/** A block of rows; each block after the first starts on a quiet rule. */
export const bloque = style({
  padding: '12px 24px',
  display: 'flex',
  flexDirection: 'column',
  selectors: { '& + &': { borderTop: `2px solid ${colors.gray200}` } },
});

export const fila = style({ display: 'flex', alignItems: 'center', minHeight: 32, gap: 12 });

export const etiqueta = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const valor = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  textAlign: 'right',
});

export const diferencia = style({
  marginTop: 6,
  minHeight: 48,
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: radii[2],
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

/** «Guarda $X para los patrones.» (OpCierreCorte): the counted cash is the owner's. */
export const recordatorio = style({
  margin: 0,
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  borderTop: borders.thin,
  background: colors.yellowSoft,
  lineHeight: 1.3,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});
