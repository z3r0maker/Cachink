import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Facturas recibidas (E-11, boards CD-06b and CD-06c): the XML drop zone,
 * the row's «Por pagar» actions and the review cards. The board drew the
 * drop zone dashed; the tokens allow solid borders only (shape.ts).
 */
export const subir = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 16,
  padding: '18px 20px',
  border: borders.thin,
  borderRadius: radii[6],
  background: colors.white,
  selectors: { '&[data-arrastrando="true"]': { background: colors.yellowSoft } },
});

export const subirTexto = style({
  flex: '1 1 320px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const subirTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

export const subirNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** The native input stays for the keyboard and screen readers, visually hidden. */
export const archivoInput = style({
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
});

export const porPagar = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 });

export const tono = styleVariants({
  neutro: { background: colors.gray100, color: colors.ink },
  alerta: { background: colors.redSoft, color: colors.redText },
  aviso: { background: colors.warningSoft, color: colors.warningText },
});

/** «Factura cancelada…» after «Cancelar» (board CD-06f). */
export const hecho = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.greenText,
});

export const pie = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const tarjeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 20,
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const tarjetaHead = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
});

export const proveedor = style({
  display: 'block',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

/** A supplier's name in a table cell or a refusal line. */
export const nombre = style({
  display: 'block',
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const montos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 10,
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[2],
  background: colors.offwhite,
});

export const montoLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const montoValor = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const fuera = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 14px',
  border: borders.quiet,
  borderRadius: radii[2],
  flexWrap: 'wrap',
});

export const fueraTexto = style({
  flex: '1 1 320px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const barraFinal = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
});
