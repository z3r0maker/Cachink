import { style } from '@vanilla-extract/css';
import {
  borders,
  brand,
  colors,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/**
 * Operador · Acceso (O-12): the register's door (OpAcceso, OpVincular). A
 * yellow half with Don Cuentas and the caja's name, a white half with the
 * step. On the phone the yellow half becomes a band on top.
 */

export const page = style({
  minHeight: '100vh',
  display: 'flex',
  background: colors.white,
  '@media': { [PHONE]: { flexDirection: 'column' } },
});

export const aside = style({
  width: '50%',
  maxWidth: 720,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  padding: '40px 56px 44px',
  background: colors.yellow,
  borderRight: borders.thick,
  '@media': {
    'screen and (max-width: 1100px)': { width: '42%', padding: '32px 32px 36px' },
    [PHONE]: {
      width: 'auto',
      maxWidth: 'none',
      gap: 14,
      padding: 16,
      borderRight: 'none',
      borderBottom: borders.thick,
    },
  },
});

export const brandRow = style({ display: 'flex', alignItems: 'center', gap: 14 });

export const wordmark = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: portalFontSizes.displayLg,
  lineHeight: brand.wordmarkLineHeight,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

export const stage = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 18,
  '@media': { [PHONE]: { alignItems: 'stretch', gap: 0 } },
});

export const bubble = style({
  position: 'relative',
  maxWidth: 460,
  margin: 0,
  padding: '18px 24px',
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: shadows.card,
  fontSize: portalFontSizes.xl3,
  lineHeight: 1.3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
  textWrap: 'pretty',
  '@media': {
    [PHONE]: { maxWidth: 'none', padding: '12px 16px', fontSize: portalFontSizes.lgx },
  },
});

/** The bubble's tail: a rotated square with the two outer edges drawn. */
export const tail = style({
  position: 'absolute',
  left: '50%',
  bottom: -13,
  width: 22,
  height: 22,
  marginLeft: -11,
  background: colors.white,
  borderRight: borders.thick,
  borderBottom: borders.thick,
  transform: 'rotate(45deg)',
  '@media': { [PHONE]: { display: 'none' } },
});

export const don = style({ '@media': { [PHONE]: { display: 'none' } } });

export const chip = style({
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 56,
  padding: '0 18px 0 12px',
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.white,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  '@media': { [PHONE]: { minHeight: 48, fontSize: portalFontSizes.md } },
});

export const chipIcon = style({
  width: 34,
  height: 34,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[1],
  background: colors.black,
  color: colors.yellow,
});

export const chipSub = style({ fontWeight: typography.weights.semibold, color: colors.gray600 });

export const main = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 32,
  '@media': { [PHONE]: { alignItems: 'flex-start', padding: '20px 16px 32px' } },
});

export const column = style({
  width: 'min(480px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
});

export const heading = style({ display: 'flex', flexDirection: 'column', gap: 10 });

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.035em',
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl4 } },
});

export const lead = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const fallo = style({
  margin: 0,
  padding: '10px 12px',
  border: borders.thin,
  borderColor: colors.redText,
  borderRadius: radii[2],
  background: colors.redSoft,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});

export * from './legado.css';
