import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** One aviso as a card (CfgAvisos): unread ones ringed in black, their action in yellow. */
export const lista = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const tarjeta = style({
  display: 'grid',
  gridTemplateColumns: '14px 52px minmax(0, 1fr) auto',
  gap: 14,
  alignItems: 'center',
  padding: '16px 18px 16px 14px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  selectors: {
    '&[data-nuevo]': { border: borders.thin },
    '&:hover': { borderColor: colors.black },
  },
  '@media': {
    '(max-width: 720px)': {
      position: 'relative',
      gridTemplateColumns: '44px minmax(0, 1fr)',
      alignItems: 'start',
      padding: 14,
      gap: 12,
    },
  },
});

export const punto = style({
  justifySelf: 'center',
  '@media': { '(max-width: 720px)': { position: 'absolute', top: 5, left: 5 } },
  boxSizing: 'border-box',
  width: 12,
  height: 12,
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.yellowSoft,
});

export const ficha = style({
  width: 52,
  height: 52,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[4],
  '@media': { '(max-width: 720px)': { width: 44, height: 44, borderRadius: radii[2] } },
});

export const texto = style({ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 });

export const meta = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const ceja = style({
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.lgx,
  lineHeight: 1.3,
  fontWeight: typography.weights.bold,
  color: colors.black,
  selectors: { '[data-nuevo] &': { fontWeight: typography.weights.extraBold } },
});

export const cuerpo = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const error = style([cuerpo, { color: colors.redText }]);

export const acciones = style({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  '@media': { '(max-width: 720px)': { gridColumn: '1 / -1', flexWrap: 'wrap' } },
});

export const ir = style({
  minHeight: 44,
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  selectors: {
    '[data-nuevo] &': { background: colors.yellow, boxShadow: shadows.small },
    '&:hover': { color: colors.black },
  },
});

export const listo = style({
  minHeight: 44,
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { borderColor: colors.black, color: colors.black },
    '&:disabled': { cursor: 'wait' },
  },
});

/** The dot's empty column on a read aviso; a phone has no such column. */
export const hueco = style({ '@media': { '(max-width: 720px)': { display: 'none' } } });
