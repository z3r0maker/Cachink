import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** The account panel (`OpCobranza.dc.html`, the drawer): head, open tickets, abonos. */
export const avatar = style({
  flex: 'none',
  width: 44,
  height: 44,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const saldoRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
});

export const saldo = style({
  fontSize: portalFontSizes.display,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
});

export const meta = style([sub, { color: colors.gray600 }]);

export const seccion = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const seccionHead = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const h3 = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

/** «Ver historial completo»: the account's own page, with every ticket and abono. */
export const historial = style({
  marginLeft: 'auto',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.blueText,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
});

const fila = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 12px',
  borderRadius: radii[2],
} as const;

export const abierta = style({ ...fila, background: colors.offwhite });

export const abono = style({ ...fila, border: borders.quiet });

export const folio = style({
  flex: 'none',
  width: 54,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const col = style({ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 });

export const fuerte = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const tenue = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const monto = {
  flex: 'none',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
} as const;

export const resta = style({ ...monto, color: colors.warningText });
export const abonado = style({ ...monto, color: colors.greenText });

export const check = style({
  flex: 'none',
  width: 28,
  height: 28,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderColor: colors.greenText,
  borderRadius: shapeRadii.pill,
  background: colors.greenSoft,
  color: colors.greenText,
});

export const nada = style({
  padding: '10px 12px',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const alCorriente = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  border: borders.quiet,
  borderColor: colors.greenText,
  borderRadius: radii[5],
  background: colors.greenSoft,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const whatsapp = style([
  pressable,
  {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: borders.thin,
    borderRadius: radii[3],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
  },
]);
