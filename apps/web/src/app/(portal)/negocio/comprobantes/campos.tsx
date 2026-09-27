'use client';

import { Switch } from '@/components';

import * as c from './comprobantes.css';
import type { Comprobantes } from './use-comprobantes';

/** Leyenda, WhatsApp and the address with its switch (C-15, 0028). */
type Campo = 'receiptLeyenda' | 'whatsapp' | 'direccion';

interface TextoProps {
  readonly id: string;
  readonly label: string;
  readonly k: Comprobantes;
  readonly campo: Campo;
  readonly disabled: boolean;
  readonly placeholder: string;
  readonly maxLength?: number;
  readonly prefijo?: string;
  readonly contador?: boolean;
}

function Cabeza({ p }: { readonly p: TextoProps }) {
  return (
    <div className={c.campoCabeza}>
      <label htmlFor={p.id} className={c.rotulo}>
        {p.label}
      </label>
      {p.contador ? (
        <span className={c.contador}>
          {p.k.form[p.campo].length}/{p.maxLength}
        </span>
      ) : null}
    </div>
  );
}

function Texto(p: TextoProps) {
  return (
    <div className={c.campo}>
      <Cabeza p={p} />
      <div className={c.caja}>
        {p.prefijo ? <span className={c.prefijo}>{p.prefijo}</span> : null}
        <input
          id={p.id}
          type={p.campo === 'whatsapp' ? 'tel' : 'text'}
          className={c.entrada}
          value={p.k.form[p.campo]}
          disabled={p.disabled}
          placeholder={p.placeholder}
          maxLength={p.maxLength}
          onChange={(e) => p.k.set(p.campo, e.target.value)}
        />
      </div>
    </div>
  );
}

function Direccion({ k, disabled }: { readonly k: Comprobantes; readonly disabled: boolean }) {
  return (
    <div className={c.campo}>
      <Texto
        id="cmp-dir"
        label="Dirección"
        k={k}
        campo="direccion"
        disabled={disabled}
        placeholder="Av. Hidalgo 214, Col. Centro · Guadalajara, Jal."
        maxLength={140}
        contador
      />
      <label className={c.interruptor}>
        <Switch
          checked={k.form.addressPrint}
          disabled={disabled}
          onCheckedChange={(v) => k.set('addressPrint', v)}
          label="Mostrar la dirección en el comprobante"
        />
        Mostrarla en el comprobante
      </label>
    </div>
  );
}

export function Campos({ k, disabled }: { readonly k: Comprobantes; readonly disabled: boolean }) {
  return (
    <>
      <div className={c.dos}>
        <Texto
          id="cmp-leyenda"
          label="Leyenda al pie"
          k={k}
          campo="receiptLeyenda"
          disabled={disabled}
          placeholder="¡Gracias por tu compra!"
          maxLength={60}
        />
        <Texto
          id="cmp-wa"
          label="WhatsApp del negocio"
          k={k}
          campo="whatsapp"
          disabled={disabled}
          placeholder="33 1234 5678"
          prefijo="+52"
        />
      </div>
      <Direccion k={k} disabled={disabled} />
    </>
  );
}
