'use client';

import type { ProductIcon } from '@xangarro/domain';

import { ProductGlyph } from '@/components/product-glyph';
import { adivinaIcono } from '@/lib/adivina-icono';

import { centavosDe, dinero, sinComas, soloMonto } from '../_primeros/formato';
import type { Fila } from './grid';
import * as s from './inventario.css';

const UNIDAD: Record<string, string> = {
  pza: 'Pieza',
  kg: 'Kilo',
  lt: 'Litro',
  m: 'Metro',
  caja: 'Caja',
  bolsa: 'Bolsa',
  rollo: 'Rollo',
  par: 'Par',
  otro: 'Otro',
};

export const cantidadDe = (f: Fila): number => Math.trunc(Number(f.cantidad)) || 0;
export const valorDe = (f: Fila): bigint => centavosDe(sinComas(f.costo)) * BigInt(cantidadDe(f));

export function TablaFilas({
  filas,
  editable,
  setFilas,
}: {
  readonly filas: readonly Fila[];
  readonly editable: boolean;
  readonly setFilas: (fn: (fs: Fila[]) => Fila[]) => void;
}) {
  return (
    <div role="list" aria-label="Productos a contar">
      {filas.map((f, i) => (
        <FilaGrid
          key={f.productoId}
          fila={f}
          editable={editable}
          onCambio={(k, v) => setFilas((fs) => fs.map((x, j) => (j === i ? { ...x, [k]: v } : x)))}
        />
      ))}
    </div>
  );
}

function FilaGrid({
  fila,
  editable,
  onCambio,
}: {
  readonly fila: Fila;
  readonly editable: boolean;
  readonly onCambio: (k: 'cantidad' | 'costo', v: string) => void;
}) {
  const q = cantidadDe(fila);
  const sinCosto = q > 0 && centavosDe(sinComas(fila.costo)) === 0n;
  return (
    <div role="listitem" className={s.fila}>
      <NombreCelda fila={fila} contado={q > 0} />
      <span className={s.unidad}>{UNIDAD[fila.unidad] ?? fila.unidad}</span>
      <Stepper fila={fila} q={q} editable={editable} onCambio={(v) => onCambio('cantidad', v)} />
      <CeldaCosto
        fila={fila}
        falta={sinCosto}
        editable={editable}
        onCambio={(v) => onCambio('costo', v)}
      />
      <span className={s.valor} data-estado={q === 0 ? 'vacio' : sinCosto ? 'falta' : 'ok'}>
        {q === 0 ? 'Sin contar' : sinCosto ? 'Falta costo' : dinero(valorDe(fila))}
      </span>
    </div>
  );
}

function NombreCelda({ fila, contado }: { readonly fila: Fila; readonly contado: boolean }) {
  const icono = (fila.icono as ProductIcon | null) ?? adivinaIcono(fila.nombre);
  return (
    <span className={s.producto}>
      <span className={s.glifo} data-contado={contado ? '' : undefined} aria-hidden="true">
        <ProductGlyph icon={icono} size={20} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={s.nombre}>{fila.nombre}</span>
        <span className={s.sku}>
          {fila.sku}
          <span className={s.unidadMovil}>
            {fila.sku === '' ? '' : ' · '}
            {UNIDAD[fila.unidad] ?? fila.unidad}
          </span>
        </span>
      </span>
    </span>
  );
}

function CeldaCosto({
  fila,
  falta,
  editable,
  onCambio,
}: {
  readonly fila: Fila;
  readonly falta: boolean;
  readonly editable: boolean;
  readonly onCambio: (v: string) => void;
}) {
  return (
    <label className={s.costo} data-falta={falta ? '' : undefined}>
      <span className={s.signo} aria-hidden="true">
        $
      </span>
      <input
        className={s.costoInput}
        aria-label={`Costo unitario de ${fila.nombre}`}
        value={fila.costo}
        disabled={!editable}
        onChange={(e) => onCambio(soloMonto(e.target.value))}
        inputMode="decimal"
      />
    </label>
  );
}

function Stepper({
  fila,
  q,
  editable,
  onCambio,
}: {
  readonly fila: Fila;
  readonly q: number;
  readonly editable: boolean;
  readonly onCambio: (v: string) => void;
}) {
  return (
    <span className={s.stepper} data-contado={q > 0 ? '' : undefined}>
      <PasoBoton
        mas={false}
        nombre={fila.nombre}
        disabled={!editable || q === 0}
        onClick={() => onCambio(q > 1 ? String(q - 1) : '')}
      />
      <input
        className={s.cantidad}
        aria-label={`Cantidad de ${fila.nombre}`}
        value={fila.cantidad}
        placeholder="0"
        disabled={!editable}
        onChange={(e) => onCambio(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
      />
      <PasoBoton
        mas
        nombre={fila.nombre}
        disabled={!editable}
        onClick={() => onCambio(String(q + 1))}
      />
    </span>
  );
}

function PasoBoton({
  mas,
  nombre,
  disabled,
  onClick,
}: {
  readonly mas: boolean;
  readonly nombre: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={s.paso}
      aria-label={`${mas ? 'Uno más' : 'Uno menos'} de ${nombre}`}
      disabled={disabled}
      onClick={onClick}
    >
      <Signo mas={mas} />
    </button>
  );
}

function Signo({ mas }: { readonly mas: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" aria-hidden="true">
      <path
        d={mas ? 'M5 12h14M12 5v14' : 'M5 12h14'}
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </svg>
  );
}
