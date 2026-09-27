import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** Operador · Inventario (`OpInventario.dc.html`): the bar under the KPIs and the owner's rule. */
export const barra = style({ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' });

/** Free adjustments are the owner's: one quiet line under the stock. */
export const regla = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

/** The 42 px tinted tile other screens borrow (Pendientes, Cierre hecho). */
export const tile = style({
  boxSizing: 'content-box',
  flex: 'none',
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  color: colors.black,
});

/** «Existencias · 10» / «Movimientos de mi turno · 5»: a quiet segmented control. */
export const tabs = style({
  flex: 'none',
  display: 'flex',
  padding: 4,
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.white,
  '@media': { [PHONE]: { flex: '1 1 100%' } },
});

export const tab = style({
  minHeight: 44,
  padding: '0 16px',
  border: borders.thin,
  borderColor: 'transparent',
  borderRadius: radii[1],
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  '@media': { [PHONE]: { flex: '1 1 0', padding: '4px 8px', lineHeight: 1.2 } },
  selectors: {
    '&[aria-selected="true"]': {
      borderColor: colors.black,
      background: colors.yellow,
      color: colors.black,
    },
  },
});
