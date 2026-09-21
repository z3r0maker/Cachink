import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes } from '@xangarro/tokens';

import {
  BARRA_CREE,
  DESTELLO,
  DOBLA,
  ESCENA_IN,
  ESCENA_OUT,
  FILA_ATERRIZA,
  INSIGNIA_POP,
  LINEA_IMPRIME,
  MONEDA_CAE,
  PRENSA,
  TICKET_BAJA,
  VUELO,
} from './animation-keys.css';

/**
 * The login animation's geometry and motion (P-02), transcribed from
 * `design-reference/portal/Xangarro Portal - Acceso y onboarding.dc.html` —
 * the keyframes are the design file's own, byte for byte.
 */

/** One scene wrapper: in over 360 ms, out over the last 360 ms of its slot.
 * The out animation's delay depends on the scene's duration, so each scene
 * gets its own class from `salidas`. */
const escenaBase = {
  position: 'absolute',
  inset: 0,
} as const;

export const escena6s = style({
  ...escenaBase,
  animation: `${ESCENA_IN} 360ms cubic-bezier(0.2,0.8,0.2,1) both, ${ESCENA_OUT} 360ms linear 5640ms both`,
});
export const escena35s = style({
  ...escenaBase,
  animation: `${ESCENA_IN} 360ms cubic-bezier(0.2,0.8,0.2,1) both, ${ESCENA_OUT} 360ms linear 3140ms both`,
});
export const escena5s = style({
  ...escenaBase,
  animation: `${ESCENA_IN} 360ms cubic-bezier(0.2,0.8,0.2,1) both, ${ESCENA_OUT} 360ms linear 4640ms both`,
});
export const escena55s = style({
  ...escenaBase,
  animation: `${ESCENA_IN} 360ms cubic-bezier(0.2,0.8,0.2,1) both, ${ESCENA_OUT} 360ms linear 5140ms both`,
});

/** The fixed 460×170 stage, uniformly scaled to whatever room the panel has. */
export const escenario = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 460,
  height: 170,
  transformOrigin: 'center center',
});

export const escenarioVista = style({
  position: 'relative',
  flex: '1 1 auto',
  minHeight: 120,
});

export const tarjetaChica = style({
  flex: 'none',
  border: `2.5px solid ${colors.black}`,
  borderRadius: 22,
  background: colors.white,
  boxShadow: `5px 5px 0 ${colors.black}`,
  padding: 14,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
});

export const ceja = style({
  fontSize: portalFontSizes.tag,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const fila = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '5px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const moneda = style({
  position: 'absolute',
  border: `2.5px solid ${colors.black}`,
  borderRadius: 9999,
  background: colors.yellowSoft,
  boxShadow: `4px 4px 0 ${colors.black}`,
  display: 'grid',
  placeItems: 'center',
  fontWeight: 800,
  color: colors.black,
});

export const pastilla = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  border: `2.5px solid ${colors.black}`,
  borderRadius: 9999,
  padding: '7px 15px',
  background: colors.white,
  boxShadow: `3px 3px 0 ${colors.black}`,
  fontSize: portalFontSizes.md,
  fontWeight: 800,
  color: colors.black,
  whiteSpace: 'nowrap',
});

export const volante = style({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  border: `2.5px solid ${colors.black}`,
  borderRadius: 6,
  background: colors.white,
  boxShadow: `5px 5px 0 ${colors.black}`,
  padding: '12px 14px',
});

export const columnaBarras = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-end',
  gap: 5,
  height: '100%',
});

export const barra = style({
  flex: 1,
  border: `2.5px solid ${colors.black}`,
  borderBottom: 'none',
  borderRadius: '8px 8px 0 0',
  transformOrigin: 'bottom center',
});

export const leyendaCuadro = style({
  width: 14,
  height: 10,
  flex: 'none',
  border: `2px solid ${colors.black}`,
  borderRadius: 3,
});

export const cifraGrande = style({
  fontSize: 52,
  lineHeight: 1,
  fontWeight: 800,
  letterSpacing: '-0.045em',
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const cifraMedia = style({
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

/** The animation classes the scenes attach, keyed by name for the components. */
export const anim = {
  prensa: style({ animation: `${PRENSA} 6s cubic-bezier(0.2,0.8,0.2,1) infinite` }),
  vuelo: style({ animation: `${VUELO} 6s cubic-bezier(0.2,0.8,0.2,1) infinite` }),
  filaAterriza: style({ animation: `${FILA_ATERRIZA} 6s cubic-bezier(0.2,0.8,0.2,1) infinite` }),
  monedaCae: style({ animation: `${MONEDA_CAE} 3500ms cubic-bezier(0.2,0.8,0.2,1) 0ms infinite` }),
  monedaCae420: style({
    animation: `${MONEDA_CAE} 3500ms cubic-bezier(0.2,0.8,0.2,1) 420ms infinite`,
  }),
  monedaCae840: style({
    animation: `${MONEDA_CAE} 3500ms cubic-bezier(0.2,0.8,0.2,1) 840ms infinite`,
  }),
  destello300: style({
    animation: `${DESTELLO} 3500ms cubic-bezier(0.2,0.8,0.2,1) 300ms infinite`,
  }),
  destello620: style({
    animation: `${DESTELLO} 3500ms cubic-bezier(0.2,0.8,0.2,1) 620ms infinite`,
  }),
  destello900: style({
    animation: `${DESTELLO} 3500ms cubic-bezier(0.2,0.8,0.2,1) 900ms infinite`,
  }),
  ticketBaja: style({ animation: `${TICKET_BAJA} 5000ms cubic-bezier(0.2,0.8,0.2,1) infinite` }),
  lineaImprime300: style({
    animation: `${LINEA_IMPRIME} 420ms cubic-bezier(0.2,0.8,0.2,1) 300ms both`,
  }),
  lineaImprime620: style({
    animation: `${LINEA_IMPRIME} 420ms cubic-bezier(0.2,0.8,0.2,1) 620ms both`,
  }),
  lineaImprime940: style({
    animation: `${LINEA_IMPRIME} 420ms cubic-bezier(0.2,0.8,0.2,1) 940ms both`,
  }),
  dobla: style({
    animation: `${DOBLA} 5000ms cubic-bezier(0.2,0.8,0.2,1) infinite`,
    transformOrigin: 'left center',
  }),
  barraCree260: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 260ms both` }),
  barraCree360: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 360ms both` }),
  barraCree460: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 460ms both` }),
  barraCree560: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 560ms both` }),
  barraCree660: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 660ms both` }),
  barraCree760: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 760ms both` }),
  barraCree860: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 860ms both` }),
  barraCree960: style({ animation: `${BARRA_CREE} 480ms cubic-bezier(0.2,0.8,0.2,1) 960ms both` }),
  insigniaPop: style({ animation: `${INSIGNIA_POP} 5500ms cubic-bezier(0.2,0.8,0.2,1) infinite` }),
};

/** Every motion off under reduced motion — the scenes hold their first frame. */
export const sinMovimiento = style({
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none !important',
    },
  },
});
