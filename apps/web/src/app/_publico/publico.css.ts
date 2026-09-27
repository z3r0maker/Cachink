import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Type and small pieces the public pages share (El Mostrador, P-02 frame). */

export const zona = style({
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: '36px 0',
  boxSizing: 'border-box',
  '@media': { '(max-width: 1023px)': { padding: '0 0 24px' } },
});

export const ancho = styleVariants({
  angosto: { maxWidth: 460 },
  medio: { maxWidth: 560 },
  amplio: { maxWidth: 680 },
});

export const cabeza = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'balance',
  '@media': { '(max-width: 599px)': { fontSize: portalFontSizes.xl5 } },
});

export const bajada = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const ceja = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.textMuted,
});

/** A card's stacked content. */
export const pila = style({ display: 'flex', flexDirection: 'column', gap: 16 });

export const dos = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: 14,
  '@media': { '(max-width: 599px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

/** The 52px glyph tile at the top of a card. */
const placaBase = {
  width: 52,
  height: 52,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[3],
  border: borders.thin,
  color: colors.black,
} as const;
export const placaTono = styleVariants({
  amarilla: { ...placaBase, background: colors.yellow },
  suave: { ...placaBase, background: colors.yellowSoft },
  verde: { ...placaBase, background: colors.greenSoft },
});

/** A one-line quiet note inside a card («Se cerrarán tus otras sesiones abiertas.»). */
export const nota = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: radii[2],
  background: colors.offwhite,
  border: borders.quiet,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

/** What is still missing before the button can do anything useful. */
export const falta = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textAlign: 'center',
});

export const pieTexto = style({
  margin: 0,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  columnGap: 6,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const enlace = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 44,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textUnderlineOffset: 3,
});

const pistaBase = {
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
} as const;

/** A live field hint: neutral, still short (red), good enough (amber), good (green). */
export const pista = styleVariants({
  neutra: { ...pistaBase, color: colors.textMuted },
  mal: { ...pistaBase, color: colors.redText },
  media: { ...pistaBase, color: colors.warningText },
  bien: { ...pistaBase, color: colors.greenText },
});
