import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/**
 * The «Estado SAT» column beyond its tag (E-11, board CD-06g): asking the
 * SAT again, its answer, and the warning row under an invoice the supplier
 * cancelled.
 */
export const columna = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
});

export const fila = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 });

/** «Consultar al SAT» sits above the row's link, which covers the whole row. */
export const consulta = style([columna, { position: 'relative', zIndex: 1 }]);

const nota = style({ fontSize: portalFontSizes.xs });

export const confirmada = style([
  nota,
  { fontWeight: typography.weights.semibold, color: colors.greenText },
]);

export const consultando = style([
  nota,
  { fontWeight: typography.weights.bold, color: colors.gray600 },
]);

export const falla = style([nota, { fontWeight: typography.weights.bold, color: colors.redText }]);

/** The invoice the supplier cancelled, and the row with its warning. */
export const filaAviso = style({ background: colors.redSoft });

/** Its own row holds its link's cover, as `rowOpen` does. */
export const filaAvisoAbre = style([filaAviso, { position: 'relative' }]);

/** Its tag, white on the red row. */
export const tagCancelada = style({ background: colors.white, color: colors.redText });
