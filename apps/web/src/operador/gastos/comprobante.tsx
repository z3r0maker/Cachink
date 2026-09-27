'use client';

import { useRef } from 'react';
import { colors } from '@xangarro/tokens';

import { mayuscula } from '../ui/dueno';
import { useDueno } from '../ui/use-dueno';
import { Icon } from '../../shell/icon';
import * as k from './comprobante.css';
import * as d from './drawer.css';

const CAMARA =
  'M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2ZM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z';
const CHECK = 'M20 6 9 17l-5-5';

/** No choice yet, a photo attached, or «No me dieron comprobante». */
export type Prueba =
  | { readonly tipo: 'nada' }
  | { readonly tipo: 'foto'; readonly nombre: string }
  | { readonly tipo: 'sin' };

/** Opens the camera (or the file picker on desktop); a tap on an attached photo removes it. */
export function Comprobante(p: {
  readonly prueba: Prueba;
  readonly setPrueba: (v: Prueba) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const nada = () => p.setPrueba({ tipo: 'nada' });
  return (
    <div className={d.campo} style={{ gap: 8 }}>
      <span className={d.label}>Comprobante</span>
      {p.prueba.tipo === 'nada' ? (
        <Nada onFoto={() => input.current?.click()} onSin={() => p.setPrueba({ tipo: 'sin' })} />
      ) : null}
      {p.prueba.tipo === 'foto' ? <Adjunto nombre={p.prueba.nombre} onQuitar={nada} /> : null}
      {p.prueba.tipo === 'sin' ? <SinComprobante onFoto={nada} /> : null}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Foto del comprobante"
        hidden
        onChange={(e) => {
          const nombre = e.target.files?.[0]?.name;
          if (nombre) p.setPrueba({ tipo: 'foto', nombre });
        }}
      />
    </div>
  );
}

function SinComprobante({ onFoto }: { readonly onFoto: () => void }) {
  const dueno = useDueno();
  return (
    <div className={k.sin}>
      <span style={{ flex: 1, minWidth: 180 }}>
        <span className={k.titulo}>Queda sin comprobante</span>
        <span className={k.hint} style={{ color: colors.warningText }}>
          {`${mayuscula(dueno)} lo va a ver marcado en tu corte.`}
        </span>
      </span>
      <button type="button" className={k.quiet} onClick={onFoto}>
        Mejor tomo la foto
      </button>
    </div>
  );
}

function Nada({ onFoto, onSin }: { readonly onFoto: () => void; readonly onSin: () => void }) {
  return (
    <>
      <button type="button" className={k.tarjeta} onClick={onFoto}>
        <span className={k.icono}>
          <Icon path={CAMARA} size={22} strokeWidth={2.2} />
        </span>
        <span>
          <span className={k.titulo}>Tomar foto del ticket</span>
          <span className={k.hint}>O elige la foto si ya la tienes</span>
        </span>
      </button>
      <button type="button" className={k.link} onClick={onSin}>
        No me dieron comprobante
      </button>
    </>
  );
}

function Adjunto({ nombre, onQuitar }: { readonly nombre: string; readonly onQuitar: () => void }) {
  return (
    <button type="button" className={k.tarjeta} data-adjunto="" onClick={onQuitar}>
      <span className={k.icono} style={{ color: colors.greenText }}>
        <Icon path={CHECK} size={22} strokeWidth={2.6} />
      </span>
      <span>
        <span className={k.titulo}>Comprobante adjunto</span>
        <span className={k.hint} style={{ color: colors.greenText }}>
          {`${nombre} · toca para quitarlo`}
        </span>
      </span>
    </button>
  );
}
