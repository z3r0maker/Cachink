'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { parseRecibido } from '../caja/ticket';
import { Campos } from './campos';
import { Comprobante, type Prueba } from './comprobante';
import * as d from './drawer.css';
import type { CategoriaGasto } from './types';

const X = 'M18 6 6 18M6 6l12 12';

export interface NuevoGasto {
  readonly monto: bigint;
  readonly concepto: string;
  readonly categoria: CategoriaGasto;
  /** Who was paid, when the operator said («La tienda, el gasero»). */
  readonly proveedor: string | null;
  /** The receipt photo's file name; `null` means «sin comprobante». */
  readonly foto: string | null;
}

/**
 * «Registrar gasto» in the right drawer: what, how much and the category are
 * required; who was paid is optional; the receipt's absence is recorded.
 * Mounted per opening.
 */
export function RegistrarGasto(p: {
  readonly firma: string;
  readonly onClose: () => void;
  readonly onSave: (g: NuevoGasto) => void;
}) {
  const x = useFormGasto(p.onSave);
  return (
    <Dialog.Root open onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={d.scrim} />
        <Dialog.Content className={d.aside} aria-describedby="rg-sub">
          <Cabeza />
          <div className={d.body}>
            <Campos x={x} />
            <Comprobante prueba={x.prueba} setPrueba={x.setPrueba} />
            <span className={d.firma}>{`Queda a tu nombre: ${p.firma}.`}</span>
          </div>
          <Pie x={x} onClose={p.onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cabeza() {
  return (
    <div className={d.head}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={d.eyebrow}>Gasto de caja chica</span>
        <Dialog.Close className={d.cerrar} aria-label="Cerrar">
          <Icon path={X} size={20} strokeWidth={2.4} />
        </Dialog.Close>
      </div>
      <Dialog.Title className={d.titulo}>Registrar gasto</Dialog.Title>
      <span id="rg-sub" className={d.sub}>
        Sale del efectivo de tu caja y baja lo esperado en tu corte.
      </span>
    </div>
  );
}

/** «Registrar gasto de $150.00»: the amount in the button, blocked until the form is complete. */
function Pie({ x, onClose }: { readonly x: FormGasto; readonly onClose: () => void }) {
  const monto = x.monto !== null && x.monto > 0n ? formatMoney(x.monto) : '$___';
  return (
    <div className={d.foot}>
      <button type="button" className={d.cancelar} onClick={onClose}>
        Cancelar
      </button>
      <button
        type="button"
        className={d.guardar}
        data-onyellow=""
        disabled={!x.listo}
        onClick={x.save}
      >
        {`Registrar gasto de ${monto}`}
      </button>
    </div>
  );
}

function useFormGasto(onSave: (g: NuevoGasto) => void) {
  const [raw, setRaw] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [quien, setQuien] = useState('');
  const [prueba, setPrueba] = useState<Prueba>({ tipo: 'nada' });
  const monto = parseRecibido(raw);
  const listo = monto !== null && monto > 0n && concepto.trim() !== '' && categoria !== null;
  const save = () => {
    if (monto === null || categoria === null || !listo) return;
    const foto = prueba.tipo === 'foto' ? prueba.nombre : null;
    const proveedor = quien.trim() === '' ? null : quien.trim();
    onSave({ monto, concepto: concepto.trim(), categoria, proveedor, foto });
  };
  const form = { raw, setRaw, monto, concepto, setConcepto, categoria, setCategoria };
  return { ...form, quien, setQuien, prueba, setPrueba, listo, save };
}

export type FormGasto = ReturnType<typeof useFormGasto>;
