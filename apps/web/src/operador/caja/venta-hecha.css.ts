import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';
import { toast as baseToast } from '../ui/toast.css';
import { NARROW } from './catalogo.css';

/**
 * «Venta registrada» (El Mostrador): the shared toast's place, clear of the
 * ticket column (440 px from the right when wide) and above the bar and tab
 * bar when narrow; inside, the board's green check, the change due big, and
 * a bar that empties.
 */
export const card = style([
  baseToast,
  {
    right: 440,
    width: 'min(380px, calc(100vw - 32px))',
    borderRadius: radii[7],
    '@media': {
      [NARROW]: { right: 16, bottom: 96 },
      [PHONE]: { bottom: 156 },
    },
  },
]);

export const body = style({
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});

export const top = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const check = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  border: borders.thick,
  borderRadius: shapeRadii.pill,
  background: colors.green,
  color: colors.black,
});

export const titulos = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });

export const titulo = style({
  fontSize: portalFontSizes.xl,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const cambioBox = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
  padding: '12px 16px',
  border: `2px solid ${colors.greenText}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
});

export const cambioK = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.greenText,
});

export const cambio = style({
  fontSize: portalFontSizes.xl6,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const nota = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textWrap: 'pretty',
});

export const acciones = style({ display: 'flex', gap: 10 });
export const crece = style({ flex: 1, padding: '0 12px' });

export const track = style({ height: 6, background: colors.gray200 });
export const fill = style({
  height: '100%',
  background: colors.yellow,
  borderRight: borders.thin,
});
