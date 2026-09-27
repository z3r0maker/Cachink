import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** «Inventario inicial» (`CfgInventarioInicial.dc.html`): toolbar and the counting grid. */
const PHONE = 'screen and (max-width: 767px)';

const COLUMNAS = 'minmax(0, 1fr) 70px 144px 128px 110px';

export const cabecera = style({
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gap: 12,
  padding: '12px 20px',
  borderBottom: borders.quiet,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.gray600,
  '@media': { [PHONE]: { display: 'none' } },
});

export const derecha = style({ textAlign: 'right' });

export const fila = style({
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gap: 12,
  alignItems: 'center',
  minHeight: 56,
  padding: '6px 20px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:hover': { background: colors.offwhite } },
  '@media': {
    [PHONE]: {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      padding: '12px 16px',
      rowGap: 10,
    },
  },
});

export const producto = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  '@media': { [PHONE]: { gridColumn: '1 / -1' } },
});

export const glifo = style({
  flex: 'none',
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.gray100,
  color: colors.black,
  selectors: { '&[data-contado]': { background: colors.yellow, border: borders.thin } },
});

export const nombre = style({
  display: 'block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const sku = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const unidad = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  '@media': { [PHONE]: { display: 'none' } },
});

export const unidadMovil = style({
  display: 'none',
  '@media': { [PHONE]: { display: 'inline' } },
});

export const stepper = style({
  display: 'flex',
  alignItems: 'center',
  width: 144,
  height: 48,
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[2],
  selectors: { '&[data-contado]': { border: borders.thin } },
  '@media': { [PHONE]: { width: '100%', gridColumn: '1 / -1' } },
});

export const paso = style({
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: 0,
  background: colors.offwhite,
  color: colors.black,
  cursor: 'pointer',
  selectors: { '&:disabled': { cursor: 'not-allowed', color: colors.gray600 } },
});

export const cantidad = style({
  flex: 1,
  width: 52,
  minWidth: 0,
  height: 44,
  border: 0,
  borderLeft: borders.quiet,
  borderRight: borders.quiet,
  textAlign: 'center',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  background: colors.white,
});

export const costo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  height: 48,
  padding: '0 12px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  selectors: {
    '&[data-falta]': { border: `2px solid ${colors.warningText}`, background: colors.warningSoft },
    '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 },
  },
});

export const signo = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const costoInput = style({
  width: '100%',
  minWidth: 0,
  border: 0,
  outline: 'none',
  background: 'none',
  textAlign: 'right',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

const tick = keyframes({ from: { transform: 'translateY(-3px)', opacity: 0.4 }, to: {} });

export const valor = style({
  textAlign: 'right',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  animation: `${tick} 300ms ease-out`,
  selectors: {
    '&[data-estado="vacio"]': { fontSize: portalFontSizes.sm, color: colors.gray600 },
    '&[data-estado="falta"]': { fontSize: portalFontSizes.sm, color: colors.warningText },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});
