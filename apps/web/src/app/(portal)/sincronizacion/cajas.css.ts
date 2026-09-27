import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** «Tus cajas» and «Historial» (CfgSincronizacion). */
export const caja = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  '@media': { '(max-width: 600px)': { flexWrap: 'wrap' } },
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const cajaIcono = style({
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderRadius: radii[2],
  background: colors.gray100,
  color: colors.black,
});

export const cajaTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: '1 1 0',
  minWidth: 0,
});

export const cajaNombre = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const cajaCuando = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
} as const;

export const pillTono = styleVariants({
  alDia: {
    ...pill,
    border: `2px solid ${colors.greenText}`,
    background: colors.greenSoft,
    color: colors.greenText,
  },
  revisar: {
    ...pill,
    border: `2px solid ${colors.warningText}`,
    background: colors.warningSoft,
    color: colors.warningText,
  },
  fuera: { ...pill, border: borders.quiet, background: colors.gray100, color: colors.gray600 },
});

const punto = { width: 7, height: 7, borderRadius: shapeRadii.pill, flex: 'none' } as const;

export const puntoTono = styleVariants({
  alDia: { ...punto, background: colors.green },
  revisar: { ...punto, background: colors.warning },
  fuera: { ...punto, background: colors.gray400 },
});

export const lista = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
});

export const evento = style({
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: '9px 0',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

const bolita = {
  width: 9,
  height: 9,
  marginTop: 6,
  flex: 'none',
  borderRadius: shapeRadii.pill,
} as const;

export const bolitaTono = styleVariants({
  envio: { ...bolita, background: colors.black },
  rechazo: { ...bolita, background: colors.warning },
  portal: { ...bolita, background: colors.blueText },
  resuelto: { ...bolita, background: colors.green },
});

export const eventoTexto = style({ display: 'flex', flexDirection: 'column', gap: 1 });

export const eventoFrase = style({
  fontSize: portalFontSizes.md,
  lineHeight: 1.35,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const eventoCuando = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const vincular = style({ fontWeight: typography.weights.extraBold, color: colors.black });
