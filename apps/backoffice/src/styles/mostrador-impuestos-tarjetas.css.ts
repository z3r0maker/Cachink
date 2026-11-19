import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Impuestos' tax cards (E-13, board CD-09): a tax's working line by line,
 * its result, and the estimate, the contador's figure and the difference.
 * A difference over $1 is a word on a chip, never a colour alone.
 */
export const tarjetas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 16,
  alignItems: 'start',
});

export const tarjeta = style({
  padding: 18,
  borderRadius: radii[4],
  background: colors.offwhite,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const linea = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 0',
  borderBottom: borders.quiet,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textDecoration: 'none',
});

export const monto = style({ fontWeight: typography.weights.bold, whiteSpace: 'nowrap' });

export const montoNegativo = style([monto, { color: colors.redText }]);

export const resultado = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  paddingTop: 10,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const resultadoMonto = style({
  fontSize: portalFontSizes.sectionTitle,
  whiteSpace: 'nowrap',
});

export const columnas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  padding: 12,
  borderRadius: radii[3],
  background: colors.white,
});

export const columna = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const valor = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const diferencia = styleVariants({
  ok: [valor, { color: colors.greenText }],
  off: [valor, { color: colors.textMuted }],
  warn: [
    valor,
    {
      alignSelf: 'flex-start',
      padding: '2px 8px',
      borderRadius: radii[1],
      background: colors.warningSoft,
      color: colors.warningText,
    },
  ],
});
