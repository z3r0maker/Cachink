'use client';

import type { Factura } from '@xangarro/application/cfdi';
import { formatMoney } from '@xangarro/domain';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { solicitarFacturaNominal, urlDescargaFactura } from '@/server/billing/facturas';

import * as f from './facturas.css';
import { fechaLarga, mesLargo } from './fecha';
import { btn } from './suscripcion.css';

/**
 * One payment and its CFDI. Timbrada downloads PDF/XML (owner and admin); En
 * factura global offers a nominative one when the fiscal data is complete, or
 * points to Negocio when it is not; Pendiente says it arrives by email.
 */
const ESTADO: Record<Factura['estado'], readonly [string, string | null]> = {
  timbrada: ['Timbrada', null],
  en_global: ['En la factura global del mes', null],
  pendiente: ['Pendiente', 'Tu factura se enviará a tu correo'],
  reembolso: ['Reembolsado', null],
};

function descargar(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function useFactura(fa: Factura) {
  const [nota, setNota] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bajar = (formato: 'pdf' | 'xml') =>
    startTransition(async () => {
      const r = await urlDescargaFactura(fa.paymentId, formato);
      if (!r.ok) return setNota(r.message);
      descargar(r.url, r.filename);
    });
  const solicitar = () =>
    startTransition(async () => {
      const r = await solicitarFacturaNominal(fa.paymentId);
      setNota(r.ok ? 'Listo: te la enviamos a tu correo en cuanto esté.' : r.message);
    });
  return { nota, pending, bajar, solicitar };
}

export interface Permisos {
  readonly owner: boolean;
  readonly mayWrite: boolean;
  /** RFC, razón social, CP and régimen are set: a nominative CFDI can be asked for. */
  readonly fiscalCompleto: boolean;
}

function Descargas(props: {
  readonly fa: Factura;
  readonly mayWrite: boolean;
  readonly fecha: string;
  readonly pending: boolean;
  readonly bajar: (formato: 'pdf' | 'xml') => void;
}) {
  const { fa, mayWrite, fecha, pending, bajar } = props;
  return (
    <>
      {mayWrite && fa.pdfDisponible ? (
        <button
          type="button"
          className={btn.quieto}
          disabled={pending}
          aria-label={`Descargar PDF del ${fecha}`}
          onClick={() => bajar('pdf')}
        >
          PDF
        </button>
      ) : null}
      {mayWrite && fa.xmlDisponible ? (
        <button
          type="button"
          className={btn.quieto}
          disabled={pending}
          aria-label={`Descargar XML del ${fecha}`}
          onClick={() => bajar('xml')}
        >
          XML
        </button>
      ) : null}
    </>
  );
}

function Acciones(props: { readonly fa: Factura; readonly fecha: string } & Permisos) {
  const { fa, owner, mayWrite, fecha } = props;
  const { nota, pending, bajar, solicitar } = useFactura(fa);
  const nominal = owner && fa.puedeSolicitarNominal;
  return (
    <span className={f.acciones}>
      <Descargas fa={fa} mayWrite={mayWrite} fecha={fecha} pending={pending} bajar={bajar} />
      {nominal && props.fiscalCompleto ? (
        <button type="button" className={btn.secundario} disabled={pending} onClick={solicitar}>
          Solicitar factura a mi nombre
        </button>
      ) : null}
      {nominal && !props.fiscalCompleto ? (
        <Link href="/negocio" className={f.accionNota}>
          Completa tus datos fiscales para facturar a tu nombre
        </Link>
      ) : null}
      {nota === null ? null : (
        <span role="status" className={f.accionNota}>
          {nota}
        </span>
      )}
    </span>
  );
}

function Estado({ fa }: { readonly fa: Factura }) {
  const manual = fa.emitidaManual && fa.cfdiUuid;
  const [corto, detalle] = manual ? ['Emitida', `UUID ${fa.cfdiUuid}`] : ESTADO[fa.estado];
  return (
    <span className={f.estado}>
      <span className={manual ? f.tono.timbrada : f.tono[fa.estado]}>{corto}</span>
      {detalle === null ? null : <span>{` · ${detalle}`}</span>}
    </span>
  );
}

export function FacturaFila(props: { readonly fa: Factura } & Permisos) {
  const { fa } = props;
  const fecha = fechaLarga(fa.paidAt);
  return (
    <li className={f.fila}>
      <span className={f.fecha}>{fecha}</span>
      <span className={f.concepto}>Tu plan · {mesLargo(fa.paidAt)}</span>
      <span className={f.total}>{formatMoney(fa.totalCentavos)}</span>
      <Estado fa={fa} />
      <Acciones {...props} fecha={fecha} />
    </li>
  );
}
