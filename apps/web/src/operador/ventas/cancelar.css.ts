import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** «¿Cancelar la venta?» (OpCancelarVenta): Don worried over a white card. */
export const cuerpo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '0 30px 26px',
  '@media': { [PHONE]: { padding: '0 18px 20px' } },
});

export const don = style({ alignSelf: 'center', marginTop: -54, marginBottom: -6, lineHeight: 0 });

export const titulos = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'center',
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'balance',
});

export const resumen = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const monto = style({
  fontVariantNumeric: 'tabular-nums',
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const grupo = style({ display: 'flex', flexDirection: 'column', gap: 8 });
export const chips = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });

const caja = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '12px 14px',
  borderRadius: radii[3],
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.black,
} as const;

export const aviso = style({
  ...caja,
  border: `2px solid ${colors.warningText}`,
  background: colors.warningSoft,
});

export const error = style({
  ...caja,
  border: `2px solid ${colors.redText}`,
  background: colors.redSoft,
});

export const pie = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginTop: 2,
});

export const pista = style({
  marginRight: 'auto',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const nip = style({ width: 180 });
export const nipInput = style({ letterSpacing: '0.3em' });
export const icono = style({ flex: 'none', marginTop: 1, lineHeight: 0 });
export const borde = style({ border: borders.thin });
