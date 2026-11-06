import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

/** «Eliminar tu cuenta» (ElEliminar): three numbered cards in one column. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 });

export const volver = style({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 36,
  padding: '0 12px 0 8px',
  borderRadius: radii[1],
  border: borders.quiet,
  background: colors.white,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textDecoration: 'none',
});

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

const tarjeta = {
  background: colors.white,
  borderRadius: radii[7],
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
} as const;

export const paso = style({ ...tarjeta, border: borders.quiet });
export const pasoFuerte = style({ ...tarjeta, border: borders.thick, boxShadow: shadows.card });

export const cabeza = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const numero = style({
  width: 32,
  height: 32,
  flex: 'none',
  borderRadius: 9999,
  background: colors.yellow,
  border: borders.thin,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const pasoTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const sub = style({
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const negocio = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 56,
  flexWrap: 'wrap',
  borderTop: borders.quiet,
});

export const negocioTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  flex: '1 1 200px',
});

export const negocioNombre = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const columnas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
});

export const columna = style({
  border: borders.quiet,
  borderRadius: radii[4],
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const columnaGuarda = style([columna, { background: colors.offwhite }]);

export const ceja = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
});

export const cejaBorra = style([ceja, { color: colors.redText }]);
export const cejaGuarda = style([ceja, { color: colors.gray600 }]);

export const item = style({
  display: 'flex',
  gap: 8,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const plan = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: radii[3],
  background: colors.yellowSoft,
  border: borders.thin,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const confirmar = style({
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
});
export const campo = style({ flex: '1 1 260px', maxWidth: 420 });

export const boton = style({
  height: 48,
  padding: '0 20px',
  borderRadius: radii[2],
  border: `2px solid ${colors.redText}`,
  background: colors.white,
  boxShadow: `3px 3px 0 ${colors.redText}`,
  color: colors.redText,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      borderColor: colors.gray200,
      background: colors.offwhite,
      color: colors.gray600,
      boxShadow: 'none',
      cursor: 'progress',
    },
  },
});
