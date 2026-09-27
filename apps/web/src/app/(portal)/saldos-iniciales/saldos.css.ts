import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** «Saldos iniciales» (`CfgSaldosIniciales.dc.html`): the fecha row and the two money cards. */
const PHONE = 'screen and (max-width: 767px)';

export const fechaFila = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 14,
  flexWrap: 'wrap',
});

export const fechaNota = style({ flex: '1 1 240px', paddingBottom: 14 });

export const dosTarjetas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media': { [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const tarjeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '16px 18px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
});

export const tarjetaCabeza = style({ display: 'flex', alignItems: 'center', gap: 10 });

const mosaico = style({
  flex: 'none',
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[1],
  color: colors.black,
});

export const mosaicoTono = styleVariants({
  verde: [mosaico, { background: colors.greenSoft }],
  azul: [mosaico, { background: colors.blueSoft }],
});

export const tarjetaLabel = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const monto = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 56,
  padding: '0 16px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  selectors: {
    '&[data-quieto]': { border: borders.quiet, background: colors.offwhite },
    '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 },
  },
});

export const montoSigno = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const montoInput = style({
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 'none',
  background: 'none',
  textAlign: 'right',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});
