'use client';

import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/components';

import { FechaPicker } from '../_primeros/fecha';
import { soloMonto } from '../_primeros/formato';
import * as p from '../_primeros/primeros.css';
import type { Saldos } from './use-saldos';
import * as r from './resumen.css';
import * as s from './saldos.css';

/** The fecha de apertura and the two money cards (caja, bancos). */
export function CamposApertura({
  f,
  hoy,
  editable,
}: {
  readonly f: Saldos;
  readonly hoy: string;
  readonly editable: boolean;
}) {
  return (
    <>
      <div className={s.fechaFila}>
        <FechaPicker
          id="fecha-apertura"
          label="Fecha de apertura"
          dialogo="Elige la fecha de apertura"
          valor={f.fecha}
          hoy={hoy}
          disabled={!editable}
          onChange={f.setFecha}
        />
        <p className={`${p.nota} ${s.fechaNota}`}>
          El día desde el que Xangarro lleva tus cuentas. Tus estados financieros empiezan aquí.
        </p>
      </div>
      <Tarjetas f={f} editable={editable} />
    </>
  );
}

function Tarjetas({ f, editable }: { readonly f: Saldos; readonly editable: boolean }) {
  return (
    <div className={s.dosTarjetas}>
      <Monto
        id="caja"
        label="Efectivo en caja"
        hint="Lo que había en el cajón ese día."
        tono="verde"
        icono={<IconoBillete />}
        valor={f.caja}
        editable={editable}
        onChange={f.setCaja}
      />
      <Monto
        id="bancos"
        label="En bancos"
        hint="La suma de las cuentas del negocio."
        tono="azul"
        icono={<IconoBanco />}
        valor={f.bancos}
        editable={editable}
        onChange={f.setBancos}
      />
    </div>
  );
}

function Monto(props: {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly tono: 'verde' | 'azul';
  readonly icono: ReactNode;
  readonly valor: string;
  readonly editable: boolean;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className={s.tarjeta}>
      <div className={s.tarjetaCabeza}>
        <span className={s.mosaicoTono[props.tono]} aria-hidden="true">
          {props.icono}
        </span>
        <label htmlFor={props.id} className={s.tarjetaLabel}>
          {props.label}
        </label>
      </div>
      <div className={s.monto} data-quieto={props.editable ? undefined : ''}>
        <span className={s.montoSigno} aria-hidden="true">
          $
        </span>
        <input
          id={props.id}
          className={s.montoInput}
          inputMode="decimal"
          placeholder="0.00"
          value={props.valor}
          disabled={!props.editable}
          onChange={(e) => props.onChange(soloMonto(e.target.value))}
        />
      </div>
      <span className={p.nota}>{props.hint}</span>
    </div>
  );
}

export function ConfirmarBloqueo({
  abierto,
  resumen,
  onCerrar,
  onBloquear,
}: {
  readonly abierto: boolean;
  readonly resumen: string;
  readonly onCerrar: () => void;
  readonly onBloquear: () => void;
}) {
  return (
    <ConfirmDialog
      open={abierto}
      onOpenChange={(o) => !o && onCerrar()}
      title="¿Bloquear los saldos iniciales?"
      body="Ya no los vas a poder cambiar. Tus estados financieros parten de aquí."
      confirmLabel="Bloquear"
      cancelLabel="Mejor no"
      destructive
      onConfirm={() => {
        onCerrar();
        onBloquear();
      }}
    >
      <div className={r.advertencia}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" aria-hidden="true">
          <path
            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={r.advertenciaTexto}>{resumen}</span>
      </div>
    </ConfirmDialog>
  );
}

const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconoBillete() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} {...TRAZO}>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconoBanco() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} {...TRAZO}>
      <path d="M10 18v-7M14 18v-7M18 18v-7M6 18v-7M3 22h18M12 2 3 7h18z" />
    </svg>
  );
}
