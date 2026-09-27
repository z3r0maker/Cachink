import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** The aside: what the business starts with, split into caja, bancos and CxC. */
export const barra = style({
  display: 'flex',
  height: 12,
  overflow: 'hidden',
  borderRadius: shapeRadii.pill,
  background: colors.gray100,
});

export const tramo = styleVariants({
  caja: { background: colors.green },
  bancos: { background: colors.blueText },
  cxc: { background: colors.warning },
});

export const leyenda = style({ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 });

export const leyendaFila = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const punto = style({
  width: 10,
  height: 10,
  borderRadius: shapeRadii.markLg,
  flex: 'none',
});

export const leyendaNombre = style({
  flex: 1,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const leyendaCifra = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const acciones = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  paddingTop: 14,
  borderTop: borders.quiet,
});

export const bloqueados = style({
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  borderRadius: shapeRadii.pill,
  border: '2px solid currentColor',
  background: colors.blueSoft,
  color: colors.blueText,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
});

export const advertencia = style({
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  marginTop: 12,
  padding: '12px 14px',
  borderRadius: radii[3],
  border: `2px solid ${colors.warningText}`,
  background: colors.warningSoft,
  color: colors.warningText,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const advertenciaTexto = style({ color: colors.black, fontVariantNumeric: 'tabular-nums' });
