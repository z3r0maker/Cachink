import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The «Sin datos fiscales» note and the edit drawer's pieces (CfgNegocio). */
export const avisoFiscal = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 10px 8px 8px',
  borderRadius: radii[4],
  background: colors.blueSoft,
  border: `2px solid ${colors.blueText}`,
  flexWrap: 'wrap',
});

export const avisoDon = style({
  width: 44,
  height: 44,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: radii[2],
  background: colors.white,
  border: `2px solid ${colors.blueText}`,
});

export const avisoTexto = style({
  flex: 1,
  minWidth: 200,
  fontSize: portalFontSizes.body,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const campos = style({ display: 'flex', flexDirection: 'column', gap: 18 });

export const pista = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const pistaAzul = style({
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.blueSoft,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const legend = style({
  padding: '0 0 4px',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const grupo = style({
  margin: 0,
  padding: 0,
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const interruptor = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.yellowSoft,
  border: borders.thin,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const interruptorQuieto = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const tipoNegocio = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const tipoLink = style({
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  whiteSpace: 'nowrap',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
});

export const attrFila = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 0',
  borderBottom: `2px solid ${colors.gray100}`,
});

export const attrPie = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const attrResumen = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 4,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const attrNombre = style({ fontWeight: typography.weights.extraBold, color: colors.black });
