import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/**
 * Balance (E-12, board CD-08): the «Activo = Pasivo + Capital» strip, the
 * sheet's two sides and their account rows, and the partners' avatars.
 */
export const cuadre = styleVariants({
  cuadra: { background: colors.white },
  roto: { background: colors.redSoft },
});

export const cuadreCuerpo = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 16,
});

export const cuadreTexto = style({
  flex: '1 1 520px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const cuadreTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
});

const estadoBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: radii[2],
  border: borders.thin,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const estado = styleVariants({
  cuadra: [estadoBase, { background: colors.greenSoft, color: colors.greenText }],
  roto: [estadoBase, { background: colors.white, color: colors.redText }],
});

export const lados = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const lado = style({
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const columnas = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 130px 130px',
  gap: 12,
  alignItems: 'center',
});

export const grupoCabeza = style([
  columnas,
  { alignItems: 'baseline', padding: '10px 0', borderBottom: borders.thin },
]);

export const grupoTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
});

export const columna = style({
  textAlign: 'right',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const cuenta = style([
  columnas,
  {
    padding: '10px 0',
    borderBottom: borders.quiet,
    color: colors.ink,
    textDecoration: 'none',
    selectors: { '&:hover': { background: colors.offwhite } },
  },
]);

export const cuentaNombre = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
});

export const nombre = style({ fontSize: portalFontSizes.md, fontWeight: typography.weights.bold });

export const nota = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

const numBase = style({
  textAlign: 'right',
  fontSize: portalFontSizes.md,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const num = styleVariants({
  actual: [numBase, { fontWeight: typography.weights.extraBold }],
  negativo: [numBase, { fontWeight: typography.weights.extraBold, color: colors.redText }],
  anterior: [numBase, { fontWeight: typography.weights.semibold, color: colors.gray600 }],
});

export const total = style([
  columnas,
  {
    marginTop: 4,
    padding: '12px 10px',
    borderRadius: radii[2],
    background: colors.offwhite,
    fontWeight: typography.weights.extraBold,
  },
]);

export const movimientos = style({
  listStyle: 'none',
  margin: 0,
  padding: '4px 0 10px 18px',
  borderBottom: borders.quiet,
});

export const movimiento = style([columnas, { padding: '6px 0', fontSize: portalFontSizes.sm }]);

export const avatar = styleVariants({
  F1: { background: colors.yellow },
  F2: { background: colors.blueSoft },
  total: { display: 'none' },
});

export const avatarBase = style({
  width: 32,
  height: 32,
  flex: '0 0 auto',
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
});

export const socio = style({ display: 'inline-flex', alignItems: 'center', gap: 10 });

export const filaTotal = style({ background: colors.offwhite });
