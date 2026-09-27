'use client';

import { useState } from 'react';

import { Icon } from '@/shell/icon';

import * as k from './controles.css';
import * as c from './comprobantes.css';

/** The logo drop zone (N-19, CfgComprobantes): a click or a dropped file. */
const SUBIR = 'M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4';
const ACEPTA = 'image/png,image/jpeg,image/svg+xml';

interface LogoProps {
  readonly logoUrl: string | null;
  readonly iniciales: string;
  readonly mayWrite: boolean;
  readonly subiendo: boolean;
  readonly onFile: (f: File | null) => void;
}

function Archivo({ p }: { readonly p: LogoProps }) {
  return (
    <input
      type="file"
      accept={ACEPTA}
      className={k.oculto}
      disabled={p.subiendo}
      onChange={(e) => p.onFile(e.target.files?.[0] ?? null)}
    />
  );
}

/** No logo yet: the whole zone takes a click or a dropped file. */
function Soltar({ p }: { readonly p: LogoProps }) {
  const [encima, setEncima] = useState(false);
  return (
    <label
      className={k.soltar}
      data-encima={encima ? '' : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        p.onFile(e.dataTransfer.files[0] ?? null);
      }}
    >
      <span className={k.soltarIcono} aria-hidden="true">
        <Icon path={SUBIR} size={20} />
      </span>
      <span className={k.soltarTexto}>
        <span className={k.fuerte}>
          {p.subiendo ? 'Subiendo tu logo…' : 'Arrastra tu logo aquí o elígelo'}
        </span>
        <span className={c.nota}>PNG, JPG o SVG hasta 2 MB. Mientras, usamos tus iniciales.</span>
      </span>
      <Archivo p={p} />
    </label>
  );
}

function Cambiar({ p }: { readonly p: LogoProps }) {
  return (
    <div className={k.soltar} style={{ cursor: 'default' }}>
      <span className={k.soltarTexto} style={{ flex: 1 }}>
        <span className={k.fuerte}>Tu logo sale en tus comprobantes</span>
        <span className={c.nota}>Si tu logo trae color, lo proponemos como color de tu marca.</span>
      </span>
      <label className={k.cambiar}>
        {p.subiendo ? 'Subiendo…' : 'Cambiar'}
        <Archivo p={p} />
      </label>
    </div>
  );
}

export function LogoBloque(p: LogoProps) {
  return (
    <div className={c.bloque}>
      <span className={c.rotulo}>Tu logo</span>
      <div className={k.logoFila}>
        <span className={k.logoTile}>
          {p.logoUrl !== null ? (
            <img
              src={p.logoUrl}
              alt="Tu logo"
              data-testid="comprobantes-logo"
              className={k.logoImg}
            />
          ) : (
            <span>{p.iniciales}</span>
          )}
        </span>
        {!p.mayWrite ? null : p.logoUrl === null ? <Soltar p={p} /> : <Cambiar p={p} />}
      </div>
    </div>
  );
}
