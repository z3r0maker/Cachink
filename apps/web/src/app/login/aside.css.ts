import { borders, colors } from '@xangarro/tokens';
import { style } from '@vanilla-extract/css';

/**
 * The login page's two-column layout (P-02): a flat-yellow sticky panel on
 * the left — wordmark row, the storefront with its shutter, the headline
 * pinned to the bottom — and the auth card on the right. Below 1024 px the
 * panel becomes a short band above the card: the wordmark and the storefront,
 * no headline and no Don Cuentas.
 */

export const rejilla = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(420px, 1fr) minmax(420px, 1fr)',
  minHeight: '100vh',
  '@media': {
    '(max-width: 1023px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const panel = style({
  background: colors.yellow,
  borderRight: `2.5px solid ${colors.black}`,
  padding: 'clamp(22px, 4.5vh, 56px) 48px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'clamp(14px, 3vh, 40px)',
  height: '100vh',
  position: 'sticky',
  top: 0,
  alignSelf: 'start',
  overflow: 'hidden',
  boxSizing: 'border-box',
  '@media': {
    '(max-width: 1023px)': {
      height: 'auto',
      position: 'static',
      padding: '18px 16px 26px',
      gap: 16,
      borderRight: 0,
      borderBottom: `2.5px solid ${colors.black}`,
    },
  },
});

export const marca = style({
  fontFamily: 'var(--font-anton), sans-serif',
  fontSize: 'clamp(34px, 4.6vw, 54px)',
  lineHeight: 0.92,
  letterSpacing: '-0.005em',
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const monedaMarca = style({
  width: 'clamp(38px, 4.4vw, 50px)',
  height: 'clamp(38px, 4.4vw, 50px)',
  flex: 'none',
  borderRadius: 9999,
  background: colors.yellow,
  border: borders.thick,
  boxShadow: `4px 4px 0 ${colors.black}`,
  display: 'grid',
  placeItems: 'center',
});

export const titular = style({
  margin: 0,
  '@media': { '(max-width: 1023px)': { display: 'none' } },
  marginTop: 'auto',
  fontSize: 'clamp(30px, 4.2vw, 48px)',
  lineHeight: 1.04,
  fontWeight: 800,
  letterSpacing: '-0.04em',
  color: colors.black,
  textWrap: 'pretty',
});

export const subtitulo = style({
  '@media': { '(max-width: 1023px)': { display: 'none' } },
  margin: 'clamp(10px, 1.8vh, 18px) 0 0',
  maxWidth: '38ch',
  fontSize: 'clamp(15px, 1.6vw, 17px)',
  fontWeight: 600,
  color: colors.black,
  textWrap: 'pretty',
});

export const columna = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '0 clamp(16px, 4vw, 48px)',
  boxSizing: 'border-box',
  '@media': {
    '(max-width: 1023px)': {
      minHeight: 'auto',
      padding: '28px 16px 6vh',
    },
  },
});
