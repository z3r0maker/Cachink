import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** Operador · Ventas, the turno's list (OpVentas): a quiet card, a header row, rows as buttons. */
export const card = style({
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

const COLUMNAS = '78px minmax(0, 1fr) minmax(180px, 300px) 60px 104px';
const AREAS = '"folio que pago hora monto"';

export const head = style({
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gap: 14,
  padding: '11px 20px',
  borderBottom: borders.quiet,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.textMuted,
  '@media': { [PHONE]: { display: 'none' } },
});

export const derecha = style({ textAlign: 'right' });

export const row = style({
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 44,
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gridTemplateAreas: AREAS,
  gap: 14,
  alignItems: 'center',
  padding: '6px 20px',
  border: 0,
  borderBottom: `2px solid ${colors.gray100}`,
  background: colors.white,
  fontFamily: 'inherit',
  textAlign: 'left',
  color: colors.black,
  cursor: 'pointer',
  selectors: {
    '&:last-child': { borderBottom: 0 },
    '&:hover, &[data-sel]': { background: colors.yellowSoft },
    '&:focus-visible': { outline: `3px solid ${colors.black}`, outlineOffset: -3 },
  },
  '@media': {
    [PHONE]: {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gridTemplateAreas: '"folio hora" "que monto" "pago pago"',
      rowGap: 4,
      padding: '12px 16px',
    },
  },
});

const mono = { fontVariantNumeric: 'tabular-nums' } as const;

export const folio = style({
  ...mono,
  gridArea: 'folio',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const que = style({
  gridArea: 'que',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  selectors: { '[data-cancelada] &': { color: colors.textMuted, textDecoration: 'line-through' } },
});

export const pago = style({
  gridArea: 'pago',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const chip = style({
  flex: 'none',
  padding: '2px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const cliente = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.warningText,
});

export const cancelada = style([
  chip,
  { border: `2px solid ${colors.redText}`, background: colors.redSoft, color: colors.redText },
]);

export const hora = style({
  ...mono,
  gridArea: 'hora',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  '@media': { [PHONE]: { textAlign: 'right' } },
});

export const monto = style({
  ...mono,
  gridArea: 'monto',
  textAlign: 'right',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  selectors: {
    '[data-fiado] &': { color: colors.warningText },
    '[data-cancelada] &': { color: colors.textMuted, textDecoration: 'line-through' },
  },
});

export const vacio = style({
  padding: '40px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'center',
});

export const vacioTitulo = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const vacioTexto = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
