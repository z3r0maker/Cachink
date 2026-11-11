import { globalStyle, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

export const marco = style({ width: '100%', maxWidth: 460, margin: '0 auto' });

export const cabezaTarjeta = style({ display: 'flex', flexDirection: 'column', gap: 6 });

/** The glyph tile, with «Paso 2 de 2» beside it when a card has one. */
export const placaConCeja = style({ display: 'flex', alignItems: 'center', gap: 14 });

/** The two secondary actions of a card, side by side; stacked on a phone. */
export const acciones = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  '@media': { '(max-width: 599px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

/** A bold address inside a card's paragraph: it may be long, so it may break. */
export const destacado = style({
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  overflowWrap: 'anywhere',
});

globalStyle(`${cabezaTarjeta} > h1`, { margin: 0 });
globalStyle(`${cabezaTarjeta} > p`, {
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const form = style({ display: 'flex', flexDirection: 'column' });

/** «Te mandamos un enlace a …»: the green receipt. */
export const enviado = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '14px 16px',
  borderRadius: radii[4],
  background: colors.greenSoft,
  border: `2px solid ${colors.greenText}`,
  color: colors.greenText,
});

export const enviadoTexto = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const correo = style({
  fontFamily: typography.fontFamily,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const aparte = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const hueco = style({ marginBottom: 16 });
