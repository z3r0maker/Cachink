import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

/** Mi negocio · Sincronización (CfgSincronizacion): hero, «Por revisar», «Tus cajas», «Historial». */
const hero = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  padding: '16px 22px 16px 16px',
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
} as const;

export const heroTono = styleVariants({
  pendiente: { ...hero, background: colors.warningSoft },
  alDia: { ...hero, background: colors.greenSoft },
});

export const heroDon = style({
  flex: 'none',
  width: 64,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[5],
});

export const heroTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: '1 1 260px',
});

export const heroTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl2,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
  textWrap: 'pretty',
});

export const heroSub = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const revisar = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 46,
  padding: '0 18px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.yellow,
  boxShadow: shadows.small,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
});

export const columnas = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
  gap: 20,
  alignItems: 'start',
  '@media': { '(max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const columna = style({ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 });

export const colHead = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  flexWrap: 'wrap',
});

export const eyebrow = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const nota = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** Quiet panels: white, 2px gray edge, radius 20. */
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 18px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const vacio = style([
  panel,
  { fontSize: portalFontSizes.md, fontWeight: typography.weights.semibold, color: colors.gray600 },
]);

const aparece = keyframes({
  '0%': { opacity: 0, transform: 'translateY(4px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

export const fade = style({
  animation: `${aparece} .25s ease`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const listo = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  border: `2px solid ${colors.greenText}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const listoIcono = style({ display: 'flex', flex: 'none', color: colors.greenText });
