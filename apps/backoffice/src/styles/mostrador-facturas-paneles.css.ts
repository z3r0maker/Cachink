import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * An invoice on credit opened in place (E-11, boards CD-06e and CD-06f):
 * the row turns warm and the panel under it pays or cancels it.
 */
export const filaAbierta = style({ background: colors.warningSoft });

export const celdaPanel = style({ padding: '0 12px 16px', borderBottom: borders.quiet });

export const panel = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: 20,
  padding: '16px 18px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
});

export const panelCancelar = style([panel, { alignItems: 'center', gap: '16px 24px' }]);

export const cabeza = style({ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 2 });

export const texto = style({ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 4 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

export const explica = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const tenue = style([explica, { color: colors.gray600 }]);

export const fecha = style({ flex: '0 1 220px', minWidth: 0 });

export const montos = style({
  flex: '1 1 320px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 28px',
  margin: 0,
  paddingBottom: 6,
});

export const monto = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const montoLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const montoValor = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const botones = style({ display: 'flex', flexWrap: 'wrap', gap: 10, paddingBottom: 2 });

export const icono = style({ flex: '0 0 auto', color: colors.redText });

export const aviso = style({ flex: '1 1 100%', margin: 0 });

/** «Factura cancelada…» under the list once the confirmation went through. */
export const hecho = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.greenText,
});
