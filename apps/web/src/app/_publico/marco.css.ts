import { globalStyle, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, shapeRadii, typography } from '@xangarro/tokens';

/** The public frame's panel pieces; the grid itself is the login's (`login/aside.css`). */

const PHONE = '(max-width: 1023px)';

export const tope = style({ display: 'flex', alignItems: 'center', gap: 14 });

/** Don fills the middle of the panel; on a phone he stands small beside nothing. */
export const escena = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '@media': { [PHONE]: { display: 'none' } },
});

globalStyle(`${escena} > span`, { maxWidth: '100%', maxHeight: '100%' });
globalStyle(`${escena} img`, { width: '100%', height: '100%', objectFit: 'contain' });

export const pie = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  '@media': { [PHONE]: { display: 'none' } },
});

/** «Gratis para siempre · Sin tarjeta · …»: black check dots on the yellow. */
export const lista = style({
  listStyle: 'none',
  margin: '6px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  '@media': { [PHONE]: { display: 'none' } },
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const punto = style({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.black,
  color: colors.yellow,
});

/** «Con o sin cuenta en Xangarro»: a white pill under the ARCO headline. */
export const chip = style({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 36,
  padding: '0 14px',
  borderRadius: shapeRadii.pill,
  background: colors.white,
  border: borders.thin,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  '@media': { [PHONE]: { display: 'none' } },
});
