import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, fontSizes, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The sideways cascade (ADR-107): label · bar on one value axis · amount. */
export const tabla = style({ display: 'grid', marginTop: 14 });

const base = {
  display: 'grid',
  gridTemplateColumns: 'minmax(150px, 190px) minmax(0, 1fr) minmax(88px, 118px)',
  gap: 14,
  alignItems: 'center',
  minHeight: 58,
  padding: '0 8px',
  borderRadius: radii[1],
  '@media': {
    'screen and (max-width: 599px)': { gridTemplateColumns: 'minmax(0, 1fr) minmax(76px, auto)' },
  },
} as const;

export const fila = styleVariants({
  resta: base,
  total: { ...base, borderTop: borders.quiet },
  finalBien: { ...base, minHeight: 68, marginTop: 6, background: colors.greenSoft },
  finalMal: { ...base, minHeight: 68, marginTop: 6, background: colors.redSoft },
});

export const rotulo = style({ display: 'grid', gap: 0 });

export const etiqueta = styleVariants({
  total: { fontSize: portalFontSizes.body, fontWeight: typography.weights.extraBold },
  resta: { fontSize: portalFontSizes.md, fontWeight: typography.weights.semibold },
});

export const etiquetaBoton = style({
  justifySelf: 'start',
  padding: 0,
  background: 'none',
  border: 0,
  font: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  textAlign: 'left',
  color: colors.black,
  textDecoration: 'underline',
  cursor: 'pointer',
});

export const nota = style({ fontWeight: typography.weights.semibold, color: colors.gray600 });

export const share = style({
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const pista = style({
  position: 'relative',
  alignSelf: 'stretch',
  '@media': { 'screen and (max-width: 599px)': { display: 'none' } },
});

export const cero = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  borderLeft: `2px solid ${colors.gray400}`,
});

const crecer = keyframes({ from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } });

const barraBase = {
  position: 'absolute',
  top: '50%',
  height: 20,
  marginTop: -10,
  borderRadius: radii[0],
  transformOrigin: 'left center',
  animation: `${crecer} 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
} as const;

export const barra = styleVariants({
  ganancia: { ...barraBase, background: colors.green, border: borders.thin },
  perdida: { ...barraBase, background: colors.red, border: borders.thin },
  resta: {
    ...barraBase,
    height: 18,
    marginTop: -9,
    background: colors.redSoft,
    border: `2px solid ${colors.redText}`,
    transformOrigin: 'right center',
  },
});

export const barraFinal = style({ height: 26, marginTop: -13 });

const monto = {
  textAlign: 'right',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
} as const;

export const valor = styleVariants({
  bien: { ...monto, color: colors.greenText },
  mal: { ...monto, color: colors.redText },
  neutro: { ...monto, color: colors.black },
});
