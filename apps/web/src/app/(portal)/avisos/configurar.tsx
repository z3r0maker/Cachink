'use client';

import type { Canal, FilaPreferencia, TipoAviso } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import { useState, useTransition } from 'react';

import { Switch } from '@/components';
import { cambiarCanalAviso } from '@/server/actions/avisos-preferencias';
import { Icon } from '@/shell/icon';

import { hecho } from './avisos.css';
import * as s from './configurar.css';

const CANDADO =
  'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2M7 11V7a5 5 0 0 1 10 0v4';

/** How each aviso reads in the matrix: its name, its group and when it arrives. */
const COPY: Record<TipoAviso, { label: string; grupo: string; desc: string }> = {
  discrepancia_caja: {
    label: 'Diferencia en un corte',
    grupo: 'Operación',
    desc: 'Cuando lo contado al cerrar no cuadra con lo esperado.',
  },
  stock_bajo: {
    label: 'Stock bajo',
    grupo: 'Operación',
    desc: 'Cuando un producto baja de su aviso de existencias.',
  },
  gasto_recurrente: {
    label: 'Gasto recurrente confirmado',
    grupo: 'Operación',
    desc: 'Cuando se confirma un gasto que se repite, como la renta o la luz.',
  },
  registros_no_enviados: {
    label: 'Registros sin enviar',
    grupo: 'Sistema',
    desc: 'Cuando una caja lleva rato sin mandar lo que guardó.',
  },
  cambio_operadores: {
    label: 'Cambios en tu equipo',
    grupo: 'Sistema',
    desc: 'Cuando alguien entra o sale de las personas que usan tus cajas.',
  },
  funcion_cambiada: {
    label: 'Función activada o desactivada',
    grupo: 'Sistema',
    desc: 'Cuando se prende o se apaga una función de tu negocio.',
  },
};

const CANAL: Record<Canal, string> = { portal: 'en el portal', correo: 'por correo' };

function Siempre() {
  return (
    <span className={s.siempre}>
      <Icon path={CANDADO} size={13} strokeWidth={2.4} />
      Siempre
    </span>
  );
}

function Fila(p: {
  readonly f: FilaPreferencia;
  readonly pending: boolean;
  readonly onToggle: (f: FilaPreferencia, canal: Canal, on: boolean) => void;
}) {
  const c = COPY[p.f.tipo];
  return (
    <div className={s.fila}>
      <span className={s.info}>
        <span className={s.nombre}>
          {c.label}
          <span className={s.grupo}>{c.grupo}</span>
        </span>
        <span className={s.desc}>{c.desc}</span>
      </span>
      {(['portal', 'correo'] as const).map((canal) => (
        <span key={canal} className={s.centro}>
          <span className={s.canalMovil} aria-hidden="true">
            {canal === 'portal' ? 'Portal' : 'Correo'}
          </span>
          {/* A critical aviso shows a lock, not a switch that refuses to move. */}
          {p.f.critico ? (
            <Siempre />
          ) : (
            <Switch
              checked={p.f[canal]}
              disabled={p.pending}
              label={`${c.label} ${CANAL[canal]}`}
              onCheckedChange={(on) => p.onToggle(p.f, canal, on)}
            />
          )}
        </span>
      ))}
    </div>
  );
}

function Cabeza({ guardado }: { readonly guardado: boolean }) {
  return (
    <div className={s.cabeza}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h2 id="avisos-cfg" className={s.ceja}>
          Cómo quieres enterarte
        </h2>
        <p className={s.explica}>
          Prende o apaga cada aviso por canal. Se guarda en cuanto lo cambias.
        </p>
      </div>
      {guardado ? (
        <span role="status" className={hecho}>
          <Icon path="M20 6 9 17l-5-5" size={15} strokeWidth={2.6} />
          Guardado
        </span>
      ) : null}
    </div>
  );
}

/**
 * «Cómo quieres enterarte» (P-32): the member's own delivery matrix, saved on
 * each switch. **A critical aviso cannot be switched off.** WhatsApp is not
 * delivered yet, so it has no column.
 */
export function ConfigurarCard({ inicial }: { readonly inicial: readonly FilaPreferencia[] }) {
  const [filas, setFilas] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();
  const onToggle = (f: FilaPreferencia, canal: Canal, on: boolean) =>
    startTransition(async () => {
      const r = await cambiarCanalAviso(f.tipo, canal, on);
      if (!r.ok) return setError(r.message);
      setError(null);
      setGuardado(true);
      setFilas(r.filas);
    });
  return (
    <section className={s.panel} aria-labelledby="avisos-cfg">
      <Cabeza guardado={guardado} />
      <div className={s.encabezado}>
        <span>Aviso</span>
        <span className={s.centro}>En el portal</span>
        <span className={s.centro}>Por correo</span>
      </div>
      {filas.map((f) => (
        <Fila key={f.tipo} f={f} pending={pending} onToggle={onToggle} />
      ))}
      {error === null ? null : (
        <p role="alert" className={s.pie} style={{ color: colors.redText }}>
          {error}
        </p>
      )}
      <p className={s.pie}>
        Las diferencias en un corte y los registros sin enviar siempre te llegan: son los que no te
        puedes perder.
      </p>
    </section>
  );
}
