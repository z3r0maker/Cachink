import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * An invoice on credit still owed (E-11, boards CD-06e and CD-06f): the row
 * opens a panel under itself to pay it on a date, or to confirm cancelling it.
 */
export const abierta = style({ background: colors.warningSoft });

export const celda = style({ padding: '0 12px 16px', borderBottom: `2px solid ${colors.gray100}` });

export const panel = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: '16px 24px',
  padding: '16px 18px',
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.white,
});

export const panelCentro = style([panel, { alignItems: 'center' }]);

export const texto = style({ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 4 });

export const textoAncho = style([texto, { flex: '1 1 420px' }]);

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

export const explica = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const nota = style({
  flex: '1 1 100%',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const fecha = style({ flex: '0 1 220px' });

export const montos = style({
  flex: '1 1 320px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 28px',
  margin: 0,
  paddingBottom: 6,
});

export const monto = style({ display: 'flex', flexDirection: 'column', gap: 2 });

export const montoLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const montoValor = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const alerta = style({ flex: '0 0 auto', color: colors.redText });

export const error = style({ flex: '1 1 100%' });
