'use client';

import { useState } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { ModalBotones } from '../ui/botones';
import { ChoiceChips } from '../ui/choice';
import * as f from '../ui/field.css';
import { OpModal } from '../ui/modal';
import { Note } from '../ui/note';
import { buscar } from './derive';
import * as s from './inventario.css';
import { MOTIVOS_MERMA, type Existencia, type MotivoMerma, type TipoMovimiento } from './types';

const SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3';

export interface NuevoMovimiento {
  readonly tipo: TipoMovimiento;
  readonly existenciaId: string;
  readonly cantidad: number;
  readonly detalle: string;
}

/** Entrada de mercancía (supplier optional) or Registrar merma (reason required). */
export function MoverExistencia(p: {
  readonly tipo: TipoMovimiento;
  readonly inicial: string | null;
  readonly items: readonly Existencia[];
  readonly firma: string;
  readonly onClose: () => void;
  readonly onSave: (m: NuevoMovimiento) => void;
}) {
  const x = useMover(p.tipo, p.inicial, p.onSave);
  const merma = p.tipo === 'Merma';
  return (
    <OpModal
      open
      onClose={p.onClose}
      title={merma ? 'Registrar merma' : 'Entrada de mercancía'}
      titleSize={portalFontSizes.lgx}
      width={520}
      headBg={merma ? colors.redSoft : colors.greenSoft}
    >
      <Producto items={p.items} value={x.producto} onChange={x.setProducto} />
      <Cantidad value={x.raw} onChange={x.setRaw} />
      <Extra merma={merma} x={x} />
      <Note bg={colors.gray100} textColor={colors.ink}>
        Queda a tu nombre y en tu turno: {p.firma}.
      </Note>
      <ModalBotones
        volver="Cancelar"
        confirmar={merma ? 'Registrar merma' : 'Registrar entrada'}
        listo={x.listo}
        tint={colors.yellow}
        onBack={p.onClose}
        onConfirm={x.save}
      />
    </OpModal>
  );
}

/** A write-off needs its reason; an entry may name the supplier. */
function Extra({ merma, x }: { readonly merma: boolean; readonly x: ReturnType<typeof useMover> }) {
  return merma ? (
    <ChoiceChips label="Motivo" options={MOTIVOS_MERMA} value={x.motivo} onChange={x.setMotivo} />
  ) : (
    <Proveedor value={x.proveedor} onChange={x.setProveedor} />
  );
}

function useMover(
  tipo: TipoMovimiento,
  inicial: string | null,
  onSave: (m: NuevoMovimiento) => void,
) {
  const [producto, setProducto] = useState(inicial);
  const [raw, setRaw] = useState('');
  const [motivo, setMotivo] = useState<MotivoMerma | null>(null);
  const [proveedor, setProveedor] = useState('');
  const cantidad = Number.parseFloat(raw);
  const listo = producto !== null && cantidad > 0 && (tipo === 'Entrada' || motivo !== null);
  const save = () => {
    if (!listo || producto === null) return;
    const detalle = tipo === 'Merma' ? (motivo ?? '') : proveedor.trim();
    onSave({ tipo, existenciaId: producto, cantidad, detalle });
  };
  return {
    producto,
    setProducto,
    raw,
    setRaw,
    motivo,
    setMotivo,
    proveedor,
    setProveedor,
    listo,
    save,
  };
}

/** Search the catalogue, then tap the item; its current stock shows alongside. */
function Producto(p: {
  readonly items: readonly Existencia[];
  readonly value: string | null;
  readonly onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const opciones = buscar(p.items, query);
  return (
    <div>
      <div className={f.label} style={{ marginBottom: 8 }}>
        Producto
      </div>
      <div className={s.picker}>
        <span style={{ color: colors.gray600, display: 'grid' }}>
          <Icon path={SEARCH} size={17} strokeWidth={2.4} />
        </span>
        <input
          type="search"
          aria-label="Buscar en el catálogo"
          placeholder="Buscar en el catálogo"
          className={s.pickerInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Opciones opciones={opciones} value={p.value} onChange={p.onChange} />
    </div>
  );
}

function Opciones(p: {
  readonly opciones: readonly Existencia[];
  readonly value: string | null;
  readonly onChange: (id: string) => void;
}) {
  return (
    <div className={s.opciones}>
      {p.opciones.map((it) => (
        <button
          key={it.id}
          type="button"
          className={s.opcion}
          aria-pressed={p.value === it.id}
          onClick={() => p.onChange(it.id)}
        >
          <span className={s.opcionName}>{it.nombre}</span>
          <span className={s.opcionQty}>{`${it.existencias} ${it.unidad}`}</span>
        </button>
      ))}
      {p.opciones.length === 0 ? (
        <div className={s.sinOpciones}>Nada coincide con esa búsqueda.</div>
      ) : null}
    </div>
  );
}

function Cantidad(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="inv-cant" className={f.label}>
        Cantidad
      </label>
      <input
        id="inv-cant"
        type="text"
        inputMode="numeric"
        placeholder="0"
        className={s.cantidad}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
      />
    </div>
  );
}

function Proveedor(p: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="inv-prov" className={f.label}>
        Proveedor (opcional)
      </label>
      <input
        id="inv-prov"
        type="text"
        className={f.text}
        placeholder="Carnicería La Central"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </div>
  );
}
