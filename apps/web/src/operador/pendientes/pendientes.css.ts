import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { PHONE } from '../shell/shell.css';

/** Registros por enviar (`OpPendientes.dc.html`, El Mostrador). */
export const column = style({ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 20 });

export const heroe = style({
  display: 'flex',
  alignItems: 'center',
  gap: 22,
  flexWrap: 'wrap',
  padding: '24px 26px',
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
  '@media': { [PHONE]: { padding: 18, gap: 14 } },
});

export const fase = styleVariants({
  espera: { background: colors.warningSoft },
  reintentando: { background: colors.warningSoft },
  enviando: { background: colors.blueSoft },
  enviado: { background: colors.greenSoft },
});

export const faseTexto = styleVariants({
  espera: { color: colors.warningText },
  reintentando: { color: colors.warningText },
  enviando: { color: colors.blueText },
  enviado: { color: colors.greenText },
});

export const heroeTile = style({
  boxSizing: 'border-box',
  flex: 'none',
  width: 72,
  height: 72,
  display: 'grid',
  placeItems: 'center',
  border: borders.thick,
  borderRadius: radii[5],
  background: colors.white,
  '@media': { [PHONE]: { width: 56, height: 56 } },
});

const girar = keyframes({ to: { transform: 'rotate(360deg)' } });

export const girando = style({
  display: 'grid',
  animation: `${girar} 1s linear infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const heroeText = style({
  flex: '1 1 300px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export const heroeTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl2 } },
});

export const heroeCuerpo = style({
  margin: 0,
  lineHeight: 1.5,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

/** A figure inside the body copy. */
export const cifra = style({
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const reintentarVivo = style({
  selectors: { '&[data-enviando]': { background: colors.white, cursor: 'progress' } },
  '@media': { [PHONE]: { flex: '1 1 100%' } },
});

/* La cola ----------------------------------------------------------------- */

export const fila = style({
  display: 'grid',
  gridTemplateColumns: '48px minmax(0, 1fr) auto 60px 110px',
  gap: 16,
  alignItems: 'center',
  minHeight: 76,
  padding: '0 22px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
  '@media': {
    [PHONE]: {
      gridTemplateColumns: '48px minmax(0, 1fr) auto',
      gap: 10,
      padding: '12px 16px',
    },
  },
});

export const filaText = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });

export const filaTitulo = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const filaDetalle = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const hora = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  '@media': { [PHONE]: { display: 'none' } },
});

export const monto = style({
  textAlign: 'right',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  '@media': { [PHONE]: { gridColumn: '2 / -1' } },
});

export const orden = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const vacia = style({
  padding: '36px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  textAlign: 'center',
});

export const vaciaTitulo = style({
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

/* Nada se pierde ---------------------------------------------------------- */

export const nota = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '16px 22px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  '@media': { [PHONE]: { padding: 14, gap: 8 } },
});

export const notaBurbuja = style({
  flex: 1,
  minWidth: 0,
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.yellowSoft,
});

export const notaTitulo = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const notaTexto = style({
  lineHeight: 1.5,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});
