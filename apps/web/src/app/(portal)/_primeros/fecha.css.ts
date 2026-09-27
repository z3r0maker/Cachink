import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

/** The date field and its month popover (the boards' date picker look). */
export const campo = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  width: 280,
  maxWidth: '100%',
  minWidth: 0,
});

export const etiqueta = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const disparador = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  height: 48,
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&[aria-expanded="true"], &:hover:not(:disabled)': { border: borders.thin },
    '&:focus-visible': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 },
    '&:disabled': { background: colors.offwhite, cursor: 'not-allowed' },
  },
});

export const valor = style({ flex: 1, minWidth: 0 });

export const vacio = style({ color: colors.gray600 });

const pop = keyframes({
  from: { transform: 'scale(0.94)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
});

export const popover = style({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  zIndex: 20,
  width: 348,
  maxWidth: 'calc(100vw - 32px)',
  padding: 14,
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[6],
  boxShadow: shadows.hero,
  transformOrigin: '0 0',
  animation: `${pop} 220ms cubic-bezier(.3,1.4,.5,1)`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
    'screen and (max-width: 767px)': { width: '100%', minWidth: 272, padding: 10 },
  },
});

export const mesFila = style({ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 });

export const mesTitulo = style({
  flex: 1,
  textAlign: 'center',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const flecha = style({
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  color: colors.black,
  cursor: 'pointer',
  selectors: { '&:hover': { border: borders.thin } },
});

export const semana = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 2,
  marginBottom: 4,
  textAlign: 'center',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: colors.gray600,
});

export const dias = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 2,
});

export const dia = style({
  height: 44,
  border: '2px solid transparent',
  borderRadius: radii[1],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.ink,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: colors.yellowSoft },
    '&[aria-pressed="true"]': {
      background: colors.yellow,
      border: borders.thin,
      color: colors.black,
    },
    '&[data-hoy]:not([aria-pressed="true"])': { border: borders.quiet },
    '&:focus-visible': { outline: `3px solid ${colors.black}`, outlineOffset: 1 },
  },
});
