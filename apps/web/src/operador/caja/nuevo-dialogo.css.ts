import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** «Producto nuevo en caja» (OpProductoNuevo): three questions beside the tile it will make. */
export const cabeza = style({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '18px 20px 18px 26px',
  borderBottom: borders.thick,
  background: colors.yellow,
  '@media': { [PHONE]: { padding: '14px 14px 14px 18px' } },
});

export const titulos = style({ display: 'flex', flexDirection: 'column', gap: 2 });
export const eyebrow = style({ color: colors.ink });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl2 } },
});

export const cerrar = style({ marginLeft: 'auto' });

export const cuerpo = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
  gap: 24,
  padding: '24px 26px',
  overflowY: 'auto',
  '@media': { [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)', padding: 18, gap: 18 } },
});

export const preguntas = style({ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 });
export const pregunta = style({ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 });

export const fieldset = style([pregunta, { border: 0, margin: 0, padding: 0 }]);

export const label = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const numero = style({
  flex: 'none',
  width: 26,
  height: 26,
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.black,
  fontSize: portalFontSizes.sm,
  color: colors.yellow,
});

export const campoGrande = style({ minHeight: 56, padding: '0 18px' });

export const nombre = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.bold,
});

export const precioCampo = style({ width: 220, maxWidth: '100%', gap: 6 });

export const peso = style({
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  color: colors.textMuted,
});

export const precio = style({
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const chips = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });

export const muestra = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 18,
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.offwhite,
});

export const h3 = style({ margin: 0 });

export const nota = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const cambiar = style({
  minHeight: 44,
  padding: '0 4px',
  border: 0,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
});

export const iconos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
  gap: 6,
});

export const icono = style([
  pressable,
  {
    height: 48,
    display: 'grid',
    placeItems: 'center',
    border: borders.quiet,
    borderRadius: radii[2],
    background: colors.white,
    color: colors.black,
    selectors: {
      '&[aria-checked="true"]': {
        border: borders.thin,
        background: colors.yellow,
        boxShadow: shadows.small,
      },
    },
  },
]);

export const info = style({
  margin: 'auto 0 0',
  display: 'flex',
  gap: 8,
  alignItems: 'flex-start',
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const pie = style({
  flex: 'none',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
  padding: '16px 26px',
  borderTop: borders.quiet,
  background: colors.offwhite,
  '@media': { [PHONE]: { padding: '12px 18px' } },
});

export const agregar = style({ minHeight: 56, fontSize: portalFontSizes.lgx });
