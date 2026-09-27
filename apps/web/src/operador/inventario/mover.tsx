'use client';

import { useState } from 'react';

import { useDueno } from '../ui/use-dueno';
import { Lateral } from '../ui/lateral';
import { conUnidad } from './derive';
import { Articulo, Cantidad, Motivos, Opcional, Tipos } from './mover-campos';
import * as s from './mover-pie.css';
import type { Existencia, MotivoMerma, TipoMovimiento } from './types';

export interface NuevoMovimiento {
  readonly tipo: TipoMovimiento;
  readonly existenciaId: string;
  readonly cantidad: number;
  readonly detalle: string;
}

/** A write-off starts at one; a delivery at five, as the board has it. */
const INICIAL: Record<TipoMovimiento, string> = { Merma: '1', Entrada: '5' };

/**
 * «¿Qué pasó con la mercancía?»: «Llegó mercancía» (who brought it, if you
 * want) or «Se echó a perder o se dañó (merma)» (what happened, always).
 */
export function MoverExistencia(p: {
  readonly tipo: TipoMovimiento;
  readonly item: Existencia;
  /** Whole quantities only (a linked caja: the domain counts in integers). */
  readonly enteros?: boolean;
  readonly onClose: () => void;
  readonly onSave: (m: NuevoMovimiento) => void;
}) {
  const x = useMover(p.tipo, p.item, p.onSave, p.enteros === true);
  return (
    <Lateral
      onClose={p.onClose}
      eyebrow="Movimiento de inventario"
      title="¿Qué pasó con la mercancía?"
      head={<Tipos value={x.tipo} onChange={x.setTipo} />}
      footer={<Pie x={x} onClose={p.onClose} />}
    >
      <Campos x={x} it={p.item} />
    </Lateral>
  );
}

type Mover = ReturnType<typeof useMover>;

function Campos({ x, it }: { readonly x: Mover; readonly it: Existencia }) {
  return (
    <>
      <Articulo it={it} />
      <Cantidad
        label={x.merma ? '¿Cuánto se echó a perder?' : '¿Cuánto llegó?'}
        raw={x.raw}
        unidad={conUnidad(x.cantidad, it.unidad).replace(/^\S+ /, '')}
        quedan={x.quedan}
        enteros={x.enteros}
        onChange={x.setRaw}
      />
      {x.merma ? (
        <Motivos value={x.motivo} onChange={x.setMotivo} />
      ) : (
        <Opcional
          id="mov-prov"
          label="¿Quién la trajo?"
          placeholder="Ej. Carnicería La Central"
          value={x.proveedor}
          onChange={x.setProveedor}
        />
      )}
      <Opcional
        id="mov-nota"
        label="Nota"
        placeholder={x.merma ? 'Ej. se quedó fuera del refri' : 'Ej. venía en nota de remisión'}
        value={x.nota}
        onChange={x.setNota}
      />
    </>
  );
}

function Pie({ x, onClose }: { readonly x: Mover; readonly onClose: () => void }) {
  const dueno = useDueno();
  return (
    <>
      <span className={s.explica}>
        {`${x.merma ? 'Esto baja' : 'Esto sube'} el inventario y ${dueno} lo ve en sus números.`}
      </span>
      <div className={s.botones}>
        <button type="button" className={s.registrar} disabled={!x.listo} onClick={x.save}>
          {x.cta}
        </button>
        <button type="button" className={s.cancelar} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </>
  );
}

function useMover(
  inicial: TipoMovimiento,
  it: Existencia,
  onSave: (m: NuevoMovimiento) => void,
  enteros: boolean,
) {
  const [tipo, setTipo] = useState(inicial);
  const [raw, setRaw] = useState(INICIAL[inicial]);
  const [motivo, setMotivo] = useState<MotivoMerma | null>(null);
  const [proveedor, setProveedor] = useState('');
  const [nota, setNota] = useState('');
  const merma = tipo === 'Merma';
  const cantidad = Number.parseFloat(raw) || 0;
  const alcanza = !merma || cantidad <= it.existencias;
  const entera = !enteros || Number.isInteger(cantidad);
  const listo = cantidad > 0 && entera && alcanza && (!merma || motivo !== null);
  const save = () => {
    if (!listo) return;
    const partes = merma ? [motivo ?? '', nota.trim()] : [proveedor.trim(), nota.trim()];
    onSave({ tipo, existenciaId: it.id, cantidad, detalle: partes.filter(Boolean).join(' · ') });
  };
  const campos = { tipo, setTipo, raw, setRaw, motivo, setMotivo };
  return {
    ...campos,
    proveedor,
    setProveedor,
    nota,
    setNota,
    merma,
    cantidad,
    enteros,
    listo,
    save,
    quedan: entera ? quedan(it, merma, cantidad, alcanza) : SOLO_ENTEROS,
    cta: `Registrar ${merma ? 'merma' : 'entrada'} de ${conUnidad(cantidad, it.unidad)}`,
  };
}

/** A linked caja counts whole units: a decimal is refused, and said so. */
export const SOLO_ENTEROS = 'Escribe una cantidad entera, sin decimales.';

/** «Te van a quedar 6 kg», «Vas a tener 13 kg, abajo del aviso». */
function quedan(it: Existencia, merma: boolean, cantidad: number, alcanza: boolean): string {
  if (!alcanza) return `Solo hay ${conUnidad(it.existencias, it.unidad)}.`;
  const despues = merma ? it.existencias - cantidad : it.existencias + cantidad;
  const aviso = despues <= it.umbral ? ', abajo del aviso' : '';
  return `${merma ? 'Te van a quedar' : 'Vas a tener'} ${conUnidad(despues, it.unidad)}${aviso}`;
}
