import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/** «Importar» (`CfgImportar.dc.html`): the template cards, the drop zone, the file head. */
const PHONE = 'screen and (max-width: 767px)';

export const paso = style({ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 });

export const pasoCabeza = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
});

export const plantillas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media': { [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const plantilla = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'stretch',
  border: borders.quiet,
  borderRadius: radii[7],
  background: colors.white,
  selectors: {
    '&[data-on]': { border: borders.thick, background: colors.yellowSoft, boxShadow: shadows.hero },
  },
});

export const plantillaBoton = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  padding: '16px 48px 60px 18px',
  border: 0,
  background: 'none',
  textAlign: 'left',
  fontFamily: 'inherit',
  cursor: 'pointer',
  borderRadius: radii[7],
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.black}`, outlineOffset: -4 } },
});

export const mosaico = style({
  flex: 'none',
  width: 52,
  height: 52,
  display: 'grid',
  placeItems: 'center',
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.gray100,
  color: colors.black,
  selectors: { [`${plantilla}[data-on] &`]: { border: borders.thin, background: colors.yellow } },
});

export const plantillaTexto = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
});

export const plantillaNombre = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const plantillaLado = style({
  position: 'absolute',
  top: 14,
  right: 16,
  bottom: 8,
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
});

export const punto = style({
  width: 24,
  height: 24,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.gray400}`,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  color: colors.yellow,
  selectors: { [`${plantilla}[data-on] &`]: { border: borders.thin, background: colors.black } },
});

export const bajar = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 44,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  whiteSpace: 'nowrap',
  pointerEvents: 'auto',
});

export const zona = style({
  position: 'relative',
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  textAlign: 'center',
  cursor: 'pointer',
  selectors: {
    '&:hover, &[data-encima]': { background: colors.yellowSoft },
    '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 3 },
  },
});

export const zonaIcono = style({
  width: 64,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[5],
  background: colors.yellow,
  boxShadow: shadows.small,
  color: colors.black,
});

export const zonaTitulo = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const zonaSub = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const subrayado = style({ textDecoration: 'underline', color: colors.black });
