import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Board CD-20c, «Mi acceso»: the member's passkeys and how they work. */
export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const panelTitle = style({
  margin: '0 0 8px',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const llave = style({
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 14,
  padding: '14px 0',
  borderTop: borders.quiet,
});

export const icono = style({
  width: 44,
  height: 44,
  borderRadius: radii[3],
  border: borders.thin,
  background: colors.yellowSoft,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.black,
});

export const llaveTexto = style({ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 });

export const llaveNombre = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const llaveNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const lista = style({
  margin: 0,
  paddingLeft: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  lineHeight: 1.45,
  color: colors.ink,
});

export const sesion = style({
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

const banner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '14px 18px',
  borderRadius: radii[4],
  border: borders.thin,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  lineHeight: 1.45,
  color: colors.ink,
});

export const aviso = style([
  banner,
  { background: colors.warningSoft, borderColor: colors.warningText },
]);
export const error = style([banner, { background: colors.redSoft, borderColor: colors.redText }]);
export const ok = style([banner, { background: colors.greenSoft, borderColor: colors.greenText }]);

export const bannerTitle = style({ fontWeight: typography.weights.extraBold });
