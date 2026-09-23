'use client';

import type { Factura } from '@xangarro/application/cfdi';
import { formatFechaHora, formatMoney } from '@xangarro/domain';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button, Card, EmptyState } from '@/components';
import { solicitarFacturaNominal, urlDescargaFactura } from '@/server/billing/facturas';
import type { ListarFacturasResult } from '@/server/billing/facturas-core';

import { cardTitle } from '@/styles/text.css';

/**
 * «Facturas» (P-10, N-33): every subscription payment with the state of its
 * CFDI — no «Solicitar factura» form, because every payment is invoiced.
 * Timbrada downloads PDF/XML (owner and admin); En factura global offers a
 * nominative one when the fiscal data is complete, or points to Negocio when
 * it is not; Pendiente says it arrives by email. Refusals show their sentence.
 */
const ESTADO: Record<Factura['estado'], string> = {
  timbrada: 'Timbrada',
  en_global: 'En la factura global del mes',
  pendiente: 'Pendiente · Tu factura se enviará a tu correo',
  reembolso: 'Reembolsado',
};

function descargar(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function useFactura(f: Factura) {
  const [nota, setNota] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bajar = (formato: 'pdf' | 'xml') =>
    startTransition(async () => {
      const r = await urlDescargaFactura(f.paymentId, formato);
      if (!r.ok) return setNota(r.message);
      descargar(r.url, r.filename);
    });
  const solicitar = () =>
    startTransition(async () => {
      const r = await solicitarFacturaNominal(f.paymentId);
      setNota(r.ok ? 'Listo: te la enviamos a tu correo en cuanto esté.' : r.message);
    });
  return { nota, pending, bajar, solicitar };
}

interface Permisos {
  readonly owner: boolean;
  readonly mayWrite: boolean;
  /** RFC, razón social, CP and régimen are set: a nominative CFDI can be asked for. */
  readonly fiscalCompleto: boolean;
}

function Acciones(props: { readonly f: Factura } & Permisos) {
  const { f, owner, mayWrite } = props;
  const { nota, pending, bajar, solicitar } = useFactura(f);
  return (
    <span
      style={{
        marginLeft: 'auto',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {mayWrite && f.pdfDisponible ? (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => bajar('pdf')}>
          PDF
        </Button>
      ) : null}
      {mayWrite && f.xmlDisponible ? (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => bajar('xml')}>
          XML
        </Button>
      ) : null}
      {owner && f.puedeSolicitarNominal && props.fiscalCompleto ? (
        <Button size="sm" variant="secondary" disabled={pending} onClick={solicitar}>
          Solicitar factura a mi nombre
        </Button>
      ) : null}
      {owner && f.puedeSolicitarNominal && !props.fiscalCompleto ? (
        <Link href="/negocio">Completa tus datos fiscales para facturar a tu nombre</Link>
      ) : null}
      {nota === null ? null : <span role="status">{nota}</span>}
    </span>
  );
}

function Fila(props: { readonly f: Factura } & Permisos) {
  const { f } = props;
  const estado = f.emitidaManual && f.cfdiUuid ? `Emitida · UUID ${f.cfdiUuid}` : ESTADO[f.estado];
  return (
    <li
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '12px 0',
      }}
    >
      <span style={{ fontWeight: 800 }}>{formatFechaHora(f.paidAt).split(',')[0]}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(f.totalCentavos)}</span>
      <span>{estado}</span>
      <Acciones {...props} />
    </li>
  );
}

export function Facturas(props: { readonly r: ListarFacturasResult } & Permisos) {
  return (
    <Card>
      <div className={cardTitle} style={{ marginBottom: 12 }}>
        Facturas
      </div>
      {!props.r.ok ? (
        <p role="alert">{props.r.message}</p>
      ) : props.r.facturas.length === 0 ? (
        // Inset: the design's empty card without a border, radius or shadow of
        // its own, because it already stands inside one (S-2).
        <EmptyState
          inset
          title="Todavía no hay cobros"
          body="Cuando pagues tu plan, aquí aparecerá cada factura con su CFDI."
        />
      ) : (
        <ul aria-label="Facturas" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {props.r.facturas.map((f) => (
            <Fila
              key={f.paymentId}
              f={f}
              owner={props.owner}
              mayWrite={props.mayWrite}
              fiscalCompleto={props.fiscalCompleto}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
