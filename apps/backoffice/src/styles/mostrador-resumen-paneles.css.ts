import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Resumen's lower panels (E-16, board CD-12b): «De dónde sale la utilidad»,
 * «Señales» and «Próximos vencimientos». A profit bar is an SVG rect, whose
 * width is an attribute: the console's CSP drops inline styles.
 */
export const fila = style({
  display: 'grid',
  gridTemplateColumns: '150px minmax(0, 1fr) 110px',
  alignItems: 'center',
  gap: 12,
  '@media': {
    'screen and (max-width: 560px)': { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto' },
  },
});

const texto = { fontSize: portalFontSizes.sm, color: colors.ink } as const;

export const etiqueta = styleVariants({
  normal: { ...texto, fontWeight: typography.weights.semibold },
  fuerte: { ...texto, fontWeight: typography.weights.extraBold },
});

export const valor = styleVariants({
  normal: {
    ...texto,
    fontWeight: typography.weights.bold,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  fuerte: {
    ...texto,
    fontWeight: typography.weights.extraBold,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  perdida: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.extraBold,
    color: colors.redText,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
});

export const pista = style({
  display: 'block',
  width: '100%',
  height: 18,
  background: colors.gray100,
  borderRadius: radii[0],
});

const senalBase = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: radii[3],
});

export const senal = styleVariants({
  info: [senalBase, { background: colors.blueSoft }],
  warn: [senalBase, { background: colors.warningSoft }],
  bad: [senalBase, { background: colors.redSoft }],
});

const iconoBase = style({
  flex: '0 0 auto',
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[1],
  background: colors.white,
  border: borders.thin,
});

export const icono = styleVariants({
  info: [iconoBase, { color: colors.blueText }],
  warn: [iconoBase, { color: colors.warningText }],
  bad: [iconoBase, { color: colors.redText }],
});

export const senalTexto = style({
  flex: '1 1 200px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const fuerte = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const detalle = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const sinSenales = style({
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const vencimiento = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderTop: borders.quiet,
});

export const vencimientoTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
});

export const vencimientoLiga = style([fuerte, { textDecoration: 'none' }]);
