/**
 * Lets a full-width Button wrap its label on narrow asides instead of pushing
 * the column wider than the phone (the shared Button never wraps).
 */
export const ENVUELVE = {
  whiteSpace: 'normal',
  height: 'auto',
  minHeight: 52,
  paddingBlock: 10,
  lineHeight: 1.2,
} as const;
