'use client';

import { colors } from '@xangarro/tokens';

import * as c from './comprobantes.css';
import * as k from './controles.css';
import type { Plantilla } from './muestra';

/** The brand colour (N-19): six suggestions, or any colour by picker or hex. */
const MUESTRAS: readonly (readonly [string, string])[] = [
  [colors.yellow, 'Amarillo Xangarro'],
  [colors.black, 'Negro'],
  [colors.green, 'Verde'],
  [colors.blueText, 'Azul'],
  [colors.purple, 'Morado'],
  [colors.redText, 'Rojo'],
];

const NOTA: Readonly<Record<Plantilla, string>> = {
  clasico: 'Se usa en el total y en los detalles.',
  moderno: 'Pinta el encabezado de tu comprobante.',
  ticket: 'El Ticket va con los colores de Xangarro: negro, blanco y amarillo.',
  minimal: 'Minimal no usa color: se ve más limpio.',
};

interface ColorProps {
  readonly valor: string;
  readonly hex: string;
  readonly plantilla: Plantilla;
  readonly disabled: boolean;
  readonly onHex: (v: string) => void;
}

const igual = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function Muestras({ p }: { readonly p: ColorProps }) {
  return (
    <div role="radiogroup" aria-label="Colores sugeridos" className={k.muestras}>
      {MUESTRAS.map(([h, label]) => (
        <button
          key={h}
          type="button"
          role="radio"
          aria-checked={igual(h, p.valor)}
          aria-label={label}
          disabled={p.disabled}
          className={k.muestra}
          style={{ background: h }}
          onClick={() => p.onHex(h)}
        />
      ))}
    </div>
  );
}

/** A colour of your own: the native picker is the swatch, the hex sits beside it. */
function Propio({ p, ok }: { readonly p: ColorProps; readonly ok: boolean }) {
  const propio = !MUESTRAS.some(([h]) => igual(h, p.valor));
  return (
    <label
      className={k.hexCaja}
      data-propio={ok && propio ? '' : undefined}
      data-mal={ok ? undefined : ''}
    >
      <input
        type="color"
        aria-label="Elegir otro color"
        disabled={p.disabled}
        value={p.valor.toLowerCase()}
        onChange={(e) => p.onHex(e.target.value)}
        className={k.gotero}
      />
      <input
        type="text"
        aria-label="Color de la marca en hexadecimal"
        className={k.hex}
        maxLength={7}
        spellCheck={false}
        disabled={p.disabled}
        value={p.hex}
        onChange={(e) => p.onHex(e.target.value)}
      />
    </label>
  );
}

export function ColorBloque(p: ColorProps) {
  const ok = /^#?[0-9a-fA-F]{6}$/.test(p.hex.trim());
  return (
    <fieldset className={c.bloque}>
      <legend className={c.rotulo} style={{ paddingBottom: 10 }}>
        Color de tu marca
      </legend>
      <div className={k.colores}>
        <Muestras p={p} />
        <span className={k.separador} aria-hidden="true" />
        <Propio p={p} ok={ok} />
      </div>
      <p className={ok ? c.nota : c.notaMal}>
        {ok ? NOTA[p.plantilla] : `Escribe un color como ${colors.yellow} (seis letras o números).`}
      </p>
    </fieldset>
  );
}
