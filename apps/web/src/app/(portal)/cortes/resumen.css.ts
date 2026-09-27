import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** «Resumen del mes»: one quiet panel, four figures split by thin rules. */
export const tira = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  padding: '16px 8px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', rowGap: 16 },
  },
});

export const celda = style({
  minWidth: 0,
  padding: '0 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  borderRight: borders.quiet,
  selectors: { '&:last-child': { borderRight: 'none' } },
  '@media': {
    '(max-width: 720px)': {
      padding: '0 14px',
      selectors: { '&:nth-child(2n)': { borderRight: 'none' } },
    },
  },
});

export const etiqueta = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const cifra = style({
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  whiteSpace: 'nowrap',
  '@media': { '(max-width: 720px)': { fontSize: portalFontSizes.xl2 } },
});

export const pista = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});
