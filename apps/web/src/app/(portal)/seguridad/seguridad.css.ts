import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Seguridad» (boards SgSeguridad and SgActivar): what the privacy page's cards do not have. */

/** The hero: tile, text and, when it is off, the one primary action. */
export const heroe = style({
  display: 'flex',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 18,
});

export const heroeTexto = style({
  flex: '1 1 320px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const cejaFila = style({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 });

export const titulo2 = style({
  margin: 0,
  fontSize: portalFontSizes.xl2,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const accion = style({ alignSelf: 'center' });

/** «Cómo funciona»: three numbered steps, side by side when there is room. */
export const pasos = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 18,
});

export const paso = style({ display: 'flex', alignItems: 'flex-start', gap: 12 });

export const numero = style({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.black,
  color: colors.yellow,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const pasoTexto = style({ display: 'flex', flexDirection: 'column', gap: 2 });

/** A row that leads with a glyph: «Al entrar a tu portal». */
export const filaIcono = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  minHeight: 64,
  borderTop: borders.quiet,
});

/** The steps inside the enrolment panel. */
export const instrucciones = style({
  margin: 0,
  paddingLeft: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const qrCaja = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 18,
  padding: 16,
  borderRadius: radii[4],
  background: colors.offwhite,
  border: borders.quiet,
});

export const qr = style({
  flex: 'none',
  padding: 8,
  borderRadius: radii[2],
  background: colors.white,
  border: borders.thin,
});

export const claveCaja = style({
  flex: '1 1 200px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
});

/** The seed and the recovery codes: evenly spaced figures, so a character is not misread. */
export const clave = style({
  fontFamily: typography.fontFamily,
  fontVariantNumeric: 'tabular-nums',
  fontSize: portalFontSizes.md,
  lineHeight: 1.6,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  color: colors.black,
  overflowWrap: 'anywhere',
});

export const codigos = style({
  listStyle: 'none',
  margin: 0,
  padding: '14px 18px',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px 18px',
  borderRadius: radii[4],
  background: colors.offwhite,
  border: borders.quiet,
  '@media': { '(max-width: 479px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const codigo = style([clave, { fontSize: portalFontSizes.lg }]);

export const tres = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
  '@media': { '(max-width: 479px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

/** «Ya los guardé en un lugar seguro»: a whole row to press, 44 px tall. */
export const casilla = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 44,
  cursor: 'pointer',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const casillaCaja = style({
  width: 22,
  height: 22,
  flex: 'none',
  margin: 0,
  accentColor: colors.black,
  cursor: 'pointer',
});

/** The panel's stacked content. */
export const panel = style({ display: 'flex', flexDirection: 'column', gap: 16 });
