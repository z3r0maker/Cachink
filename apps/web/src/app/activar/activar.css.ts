import { portalFontSizes, typography } from '@xangarro/tokens';
import { style } from '@vanilla-extract/css';

/** `/activar`: a plain page, the portal's own type scale (C-14). */
export const page = style({
  maxWidth: 520,
  margin: '64px auto',
  padding: '0 16px',
  lineHeight: 1.5,
});

export const title = style({
  fontSize: portalFontSizes.xl3,
  letterSpacing: typography.letterSpacing.tighter,
  margin: '0 0 12px',
});
