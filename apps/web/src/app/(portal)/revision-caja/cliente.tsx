'use client';

import { useState } from 'react';
import { formatMoney, toPesosString } from '@xangarro/domain';
import { portalFontSizes } from '@xangarro/tokens';

import { parseRecibido } from '@/operador/caja/ticket';
import * as ab from '@/operador/cobranza/abono.css';
import { ChoiceChips } from '@/operador/ui/choice';
import { MontoInput } from '@/operador/ui/monto';

import { Par, Revisar, type CampoDef } from './comun';
import { aprobadoCliente } from './derive';
import * as s from './form.css';
import type { ClienteCaja } from './types';

const PLAZOS = ['Al contado del día', '7 días', '15 días', '30 días'] as const;
const LIMITES = [500_00n, 1000_00n, 2000_00n, 5000_00n] as const;

/** Name, phone, **credit limit** and **term**; limit + term approve. */
export function RevisarCliente(p: {
  readonly x: ClienteCaja;
  readonly onClose: () => void;
  readonly onFusionar: () => void;
  readonly onAprobar: (body: string) => void;
}) {
  const f = useCliente(p.x);
  const aprobar = () =>
    f.listo && p.onAprobar(aprobadoCliente(f.nombre || p.x.nombre, f.limite ?? 0n, f.plazo ?? ''));
  return (
    <Revisar
      titulo={`Revisar cliente ${p.x.nombre}`}
      capturado={`Nombre «${p.x.nombre}», teléfono ${p.x.telefono}. ${p.x.detalle}`}
      pareceA={p.x.pareceA}
      cta="Aprobar cliente con límite"
      listo={f.listo}
      onClose={p.onClose}
      onFusionar={p.onFusionar}
      onAprobar={aprobar}
    >
      <Par campos={f.contacto} min={200} />
      <Limite raw={f.limiteRaw} setRaw={f.setLimite} />
      <ChoiceChips
        label="Plazo para pagar"
        options={PLAZOS}
        value={f.plazo}
        onChange={f.setPlazo}
      />
      <div className={s.fila}>
        <span className={s.debeLabel}>Ya debe</span>
        <span className={s.figura} style={{ fontSize: portalFontSizes.xl2 }}>
          {formatMoney(p.x.fiado)}
        </span>
      </div>
    </Revisar>
  );
}

function Limite({ raw, setRaw }: { readonly raw: string; readonly setRaw: (v: string) => void }) {
  return (
    <div>
      <MontoInput
        id="rv-limite"
        label="Límite de fiado"
        value={raw}
        onChange={setRaw}
        size="limite"
      />
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 10 }}>
        {LIMITES.map((v) => (
          <button
            key={String(v)}
            type="button"
            className={ab.rapido}
            onClick={() => setRaw(toPesosString(v).replace(/\.00$/, ''))}
          >
            {formatMoney(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

function useCliente(x: ClienteCaja) {
  const [nombre, setNombre] = useState(x.nombre);
  const [tel, setTel] = useState(x.telefono);
  const [limiteRaw, setLimite] = useState('');
  const [plazo, setPlazo] = useState<(typeof PLAZOS)[number] | null>(null);
  const limite = parseRecibido(limiteRaw);
  const contacto: readonly CampoDef[] = [
    { id: 'rv-nombre', label: 'Nombre', value: nombre, set: setNombre, className: s.texto },
    {
      id: 'rv-tel',
      label: 'Teléfono',
      value: tel,
      set: (v) => setTel(v.replace(/[^0-9 ]/g, '')),
      className: s.texto,
      inputMode: 'tel',
    },
  ];
  const listo = limite !== null && plazo !== null;
  return { nombre, contacto, limiteRaw, setLimite, limite, plazo, setPlazo, listo };
}
