import { style } from '@vanilla-extract/css';
import { colors, radii } from '@xangarro/tokens';

import { line, t } from './theme.css';

/** The confirmation `<dialog>` of `ConfirmForm`. */
export const dialog = style({
  maxWidth: 440,
  padding: 24,
  border: line.thick,
  borderRadius: radii[4],
  boxShadow: `4px 4px 0 ${t.line}`,
  background: t.surface,
  color: t.body,
  selectors: { '&::backdrop': { background: colors.scrim } },
});

export const dialogActions = style({ display: 'flex', gap: 12, marginTop: 16 });
