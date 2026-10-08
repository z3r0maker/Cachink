import { keyframes, style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

const entra = keyframes({
  from: { transform: 'translate(-50%, 16px)', opacity: 0 },
  to: { transform: 'translate(-50%, 0)', opacity: 1 },
});

/** An export that failed (DS-02, EsExportar): one line, bottom centre, until closed. */
export const aviso = style({
  position: 'fixed',
  left: '50%',
  bottom: 32,
  zIndex: 70,
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  maxWidth: 'calc(100vw - 32px)',
  boxSizing: 'border-box',
  padding: '8px 8px 8px 16px',
  borderRadius: radii[4],
  background: colors.white,
  border: borders.thin,
  boxShadow: shadows.card,
  animation: `${entra} 280ms cubic-bezier(0.2, 0.8, 0.3, 1)`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const icono = style({
  flex: 'none',
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.redSoft,
  border: `2px solid ${colors.redText}`,
  color: colors.redText,
});

export const texto = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const cerrar = style({
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[2],
  border: borders.quiet,
  background: colors.white,
  color: colors.black,
  cursor: 'pointer',
});

/** «XLSX» after the label, as the board tags an export's format. */
export const formato = style({
  padding: '2px 6px',
  borderRadius: shapeRadii.markLg,
  background: colors.gray100,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.06em',
  color: colors.gray600,
});
