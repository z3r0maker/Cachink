import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** DS-10 under «Conectar esta caja» (EsCajaDescarga): the line, the count, the bar. */
export const caja = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.offwhite,
  selectors: {
    '&[data-interrumpida]': {
      border: `2px solid ${colors.warningText}`,
      background: colors.warningSoft,
    },
  },
});

export const fila = style({ display: 'flex', alignItems: 'flex-start', gap: 10 });

export const texto = style({
  flex: 1,
  fontSize: portalFontSizes.body,
  lineHeight: 1.4,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const icono = style({ display: 'inline-flex', color: colors.warningText });

export const cuenta = style({
  flex: 'none',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  selectors: { '[data-interrumpida] &': { color: colors.warningText } },
});

export const barra = style({
  height: 14,
  boxSizing: 'border-box',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  overflow: 'hidden',
});

export const relleno = style({
  display: 'block',
  height: '100%',
  boxSizing: 'border-box',
  borderRight: borders.thin,
  background: colors.yellow,
  transition: 'width 300ms ease-out',
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});
