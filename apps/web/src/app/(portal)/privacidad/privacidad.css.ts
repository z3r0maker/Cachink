import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

/** «Privacidad y mis datos» (PvPagina): cards in one column, the first two side by side. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const bajada = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
});

export const tarjeta = style({
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  padding: '18px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const nuevo = style({
  background: colors.yellowSoft,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.card,
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const ceja = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const h2 = style({
  margin: 0,
  fontSize: portalFontSizes.lgx,
  lineHeight: 1.35,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const sub = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const texto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const acciones = style({ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' });

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  minHeight: 64,
  borderTop: borders.quiet,
});

export const filaTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: '1 1 240px',
});

export const filaTitulo = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const switchFila = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const ok = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.greenText,
});

export const peligro = style({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  height: 44,
  padding: '0 16px',
  borderRadius: radii[2],
  border: `2px solid ${colors.redText}`,
  background: colors.white,
  color: colors.redText,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
});

export const parrafo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.55,
  color: colors.ink,
});

export const huella = style({
  margin: '8px 0 0',
  padding: '10px 12px',
  borderRadius: radii[2],
  background: colors.offwhite,
  border: borders.quiet,
  fontSize: portalFontSizes.xs,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** «Aviso completo»: an action that leaves the page, drawn as a quiet button, never a bare link. */
export const enlace = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: 44,
  padding: '0 14px',
  borderRadius: radii[2],
  border: borders.quiet,
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'none',
});
