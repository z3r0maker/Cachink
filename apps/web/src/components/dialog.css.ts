import { globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

const pop = keyframes({
  from: { opacity: 0, transform: 'translate(-50%, -50%) scale(0.96)' },
  to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

/**
 * The modal card is opaque: only the backdrop is translucent. With Don
 * Cuentas it leaves room on top for him to peek over the edge (ADR-107), so
 * the card itself does not clip; its text scrolls inside.
 */
const panel = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(480px, calc(100vw - 32px))',
  display: 'flex',
  flexDirection: 'column',
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[7],
  boxShadow: shadows.hero,
  padding: '28px 28px 24px',
  animation: `${pop} 160ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
} as const;

export const dialogPanel = styleVariants({
  plain: panel,
  conDon: { ...panel, paddingTop: 72, marginTop: 34 },
});

/** Don sits half above the card, centred, over its top border. */
export const dialogDon = style({
  position: 'absolute',
  top: -70,
  left: '50%',
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
});

export const dialogScroll = style({
  maxHeight: 'calc(100vh - 220px)',
  overflowY: 'auto',
});

export const dialogTitle = style({
  margin: 0,
  fontSize: fontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const dialogBody = style({
  margin: '10px 0 0',
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textWrap: 'pretty',
});

export const dialogActions = style({
  display: 'flex',
  gap: 10,
  marginTop: 24,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
});

/** Under Don the question and its consequence are centred; the fields are not. */
globalStyle(`${dialogPanel.conDon} ${dialogTitle}, ${dialogPanel.conDon} ${dialogBody}`, {
  textAlign: 'center',
});

globalStyle(`${dialogPanel.conDon} ${dialogActions}`, { justifyContent: 'center' });
