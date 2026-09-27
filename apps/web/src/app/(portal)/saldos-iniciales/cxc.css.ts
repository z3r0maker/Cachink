import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** The «Cuentas por cobrar iniciales» panel: head, rows, footer. */
const PHONE = 'screen and (max-width: 767px)';
const COLUMNAS = 'minmax(0, 1fr) 150px 180px 44px';

export const cabeza = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '14px 20px',
});

export const cabezaTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: '1 1 260px',
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const aviso = style({ margin: '0 20px 12px' });

export const encabezados = style({
  display: 'grid',
  gridTemplateColumns: COLUMNAS,
  gap: 12,
  padding: '10px 20px',
  borderTop: borders.quiet,
  borderBottom: borders.quiet,
  background: colors.offwhite,
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
  minHeight: 60,
  padding: '8px 20px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:hover': { background: colors.offwhite } },
  '@media': {
    [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr) 44px', padding: '12px 16px', rowGap: 8 },
  },
});

export const cliente = style({ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 });

export const avatar = style({
  flex: 'none',
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.peachSoft,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const nombre = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const elegir = style({
  flex: 1,
  minWidth: 0,
  height: 44,
  padding: '0 12px',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const telefono = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  '@media': { [PHONE]: { display: 'none' } },
});

export const saldo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  height: 44,
  padding: '0 12px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  selectors: { '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 } },
  '@media': { [PHONE]: { gridColumn: 1 } },
});

export const saldoInput = style({
  width: '100%',
  minWidth: 0,
  border: 0,
  outline: 'none',
  background: 'none',
  textAlign: 'right',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const quitar = style({
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  color: colors.gray600,
  cursor: 'pointer',
  selectors: { '&:hover': { border: borders.thin, color: colors.black } },
});

export const vacio = style({ padding: '22px 20px' });

export const pie = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '10px 20px 12px',
});

export const teDeben = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const teDebenCifra = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.warningText,
});

export const agregar = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 44,
  padding: '0 14px',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  cursor: 'pointer',
  selectors: { '&:hover': { border: borders.thin } },
});
