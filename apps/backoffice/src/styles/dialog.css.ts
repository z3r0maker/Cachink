import { style } from '@vanilla-extract/css';
import { borders, colors, radii, shadows } from '@xangarro/tokens';

/** The confirmation `<dialog>` of `ConfirmForm`. */
export const dialog = style({
  maxWidth: 440,
  padding: 24,
  border: borders.thick,
  borderRadius: radii[4],
  boxShadow: shadows.card,
  background: colors.white,
  color: colors.ink,
  selectors: { '&::backdrop': { background: '${colors.scrim}' } },
});

export const dialogActions = style({ display: 'flex', gap: 12, marginTop: 16 });
