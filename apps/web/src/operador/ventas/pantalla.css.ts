import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** Ventas' page (OpVentas): the turno's four figures in one strip, then search and filters. */
export const resumen = style({
  display: 'flex',
  alignItems: 'center',
  padding: '14px 8px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': { [PHONE]: { flexWrap: 'wrap', rowGap: 14 } },
});

export const cifra = style({
  flex: 1,
  minWidth: 0,
  padding: '0 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  selectors: { '&:not(:last-child)': { borderRight: borders.quiet } },
  '@media': {
    [PHONE]: {
      flex: '1 1 40%',
      padding: '0 12px',
      selectors: { '&:nth-child(2n)': { borderRight: 0 } },
    },
  },
});

export const cifraK = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const cifraV = style({
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  whiteSpace: 'nowrap',
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl2 } },
});

export const filtros = style({ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' });
export const buscar = style({ flex: '1 1 280px' });

export const chips = style({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  '@media': { [PHONE]: { flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 } },
});
