'use client';

import { colors } from '@xangarro/tokens';
import type { ReactElement } from 'react';

import * as c from './comprobantes.css';
import * as k from './controles.css';
import { TEMPLATES, type Plantilla } from './muestra';

/** The four templates as radio cards, each with a small drawing of itself. */
const { black: N, white: B, gray200: G, gray400: L, yellow: Y } = colors;

const SVG = { viewBox: '0 0 60 70', width: 60, height: 70, 'aria-hidden': true } as const;

type Mini = (props: { readonly color: string }) => ReactElement;

const Ticket: Mini = () => (
  <svg {...SVG}>
    <rect x="17" y="5" width="30" height="64" fill={N} />
    <rect x="15" y="3" width="30" height="64" fill={B} stroke={N} />
    <rect x="15" y="3" width="30" height="9" fill={Y} stroke={N} />
    <path d="M20 17h20M20 42h20" stroke={N} strokeDasharray="2 2" />
    <path d="M20 23h20M20 29h20M20 35h20" stroke={L} strokeWidth="2" />
    <rect x="20" y="49" width="20" height="5" fill={Y} stroke={N} />
  </svg>
);

const Moderno: Mini = ({ color }) => (
  <svg {...SVG}>
    <rect x="5" y="5" width="50" height="60" rx="7" fill={B} stroke={G} />
    <path d="M5 12a7 7 0 0 1 7-7h36a7 7 0 0 1 7 7v9H5z" fill={color} />
    <rect x="10" y="10" width="7" height="7" rx="2" fill={B} />
    <path d="M20 13.5h18" stroke={N} strokeWidth="2" />
    <path d="M11 30h38M11 36h38" stroke={L} strokeWidth="2" />
    <rect x="11" y="44" width="38" height="6" fill={G} />
    <rect x="11" y="44" width="3" height="6" fill={N} />
  </svg>
);

const Minimal: Mini = () => (
  <svg {...SVG}>
    <rect x="5" y="5" width="50" height="60" rx="4" fill={B} stroke={G} />
    <path d="M12 15h22" stroke={N} strokeWidth="3" />
    <path d="M12 24h34M12 30h34" stroke={L} />
    <path d="M30 48h16" stroke={N} strokeWidth="4" />
  </svg>
);

const Clasico: Mini = ({ color }) => (
  <svg {...SVG}>
    <rect x="7" y="7" width="50" height="60" fill={N} />
    <rect x="5" y="5" width="50" height="60" fill={B} stroke={N} strokeWidth="1.5" />
    <rect x="25" y="10" width="10" height="10" rx="2" fill={color} stroke={N} />
    <path d="M15 26h30" stroke={N} strokeWidth="2" />
    <path d="M13 33h34M13 39h34" stroke={L} strokeWidth="2" />
    <rect x="12" y="48" width="36" height="7" fill={color} stroke={N} />
  </svg>
);

const MINI: Readonly<Record<Plantilla, Mini>> = {
  ticket: Ticket,
  clasico: Clasico,
  moderno: Moderno,
  minimal: Minimal,
};

export function PlantillaBloque(props: {
  readonly valor: Plantilla;
  readonly color: string;
  readonly onPick: (t: Plantilla) => void;
}) {
  return (
    <fieldset className={c.bloque}>
      <legend className={c.rotulo} style={{ paddingBottom: 10 }}>
        Plantilla
      </legend>
      <div role="radiogroup" aria-label="Plantilla del comprobante" className={k.plantillas}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={props.valor === t.id}
            className={k.plantilla}
            onClick={() => props.onPick(t.id)}
          >
            <span className={k.miniatura}>{MINI[t.id]({ color: props.color })}</span>
            <span className={k.plantillaNombre}>{t.titulo}</span>
            <span className={k.plantillaDesc} data-recomendado={t.id === 'ticket' ? '' : undefined}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
