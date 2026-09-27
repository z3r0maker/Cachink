import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** Plan y pagos (CfgPlan): the shared pieces, section heads and the house buttons. */
export const seccion = style({ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 });

export const seccionHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
});

export const seccionTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const nota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const notaDerecha = style([nota, { marginLeft: 'auto' }]);

export const eyebrow = style({
  margin: 0,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

const boton = style([
  pressable,
  {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    padding: '0 16px',
    borderRadius: radii[2],
    fontFamily: typography.fontFamily,
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textDecoration: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
]);

/** Primary yellow, secondary white, quiet gray edge, destructive red outline. */
export const btn = styleVariants({
  primario: [boton, { border: borders.thin, background: colors.yellow, boxShadow: shadows.small }],
  secundario: [boton, { border: borders.thin, background: colors.white, boxShadow: shadows.small }],
  quieto: [
    boton,
    {
      border: borders.quiet,
      background: colors.white,
      fontWeight: typography.weights.bold,
      selectors: { '&:hover:not(:disabled)': { borderColor: colors.black } },
    },
  ],
  peligro: [
    boton,
    { border: `2px solid ${colors.redText}`, background: colors.white, color: colors.redText },
  ],
});

export const lleno = style({ width: '100%' });

export const errorTexto = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});

/** «Precios en pesos», the pausa row and the entitlement line: quiet text. */
export const pausa = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  paddingTop: 18,
  borderTop: borders.quiet,
});

export const pausaTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: '1 1 260px',
});

export const pausaTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const recibe = style([nota, { margin: 0 }]);

/** Past due and lapsed: the problem, what happens next and the fix. */
export const aviso = styleVariants({
  atrasado: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    padding: '14px 20px 14px 14px',
    border: borders.thick,
    borderRadius: radii[7],
    boxShadow: shadows.hero,
    background: colors.warningSoft,
  },
  vencido: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    padding: '14px 20px 14px 14px',
    border: borders.thick,
    borderRadius: radii[7],
    boxShadow: shadows.hero,
    background: colors.redSoft,
  },
});

export const avisoDon = style({
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

export const avisoTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: '1 1 280px',
});

export const avisoTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const avisoCuerpo = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});
