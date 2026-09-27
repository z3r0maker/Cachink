'use client';

import Link from 'next/link';

import type { ListarFacturasResult } from '@/server/billing/facturas-core';

import { FacturaFila, type Permisos } from './factura-fila';
import * as f from './facturas.css';
import { eyebrow, nota } from './suscripcion.css';

/**
 * «Facturas» (P-10, N-33): every subscription payment with the state of its
 * CFDI. No «Solicitar factura» form, because every payment is invoiced.
 * Refusals show their sentence.
 */
function Encabezados() {
  return (
    <div className={f.encabezados} aria-hidden="true">
      <span className={eyebrow}>Fecha</span>
      <span className={eyebrow}>Concepto</span>
      <span className={`${eyebrow} ${f.derecha}`}>Total</span>
      <span className={eyebrow}>Estado</span>
      <span className={`${eyebrow} ${f.derecha}`}>Descargar</span>
    </div>
  );
}

function Cuerpo(props: { readonly r: ListarFacturasResult } & Permisos) {
  if (!props.r.ok) return <p role="alert">{props.r.message}</p>;
  if (props.r.facturas.length === 0) {
    return (
      <p className={f.vacio}>
        Todavía no hay cobros. Cuando pagues tu plan, aquí aparecerá cada factura con su CFDI.
      </p>
    );
  }
  return (
    <>
      <Encabezados />
      <ul aria-label="Facturas" className={f.lista}>
        {props.r.facturas.map((fa) => (
          <FacturaFila
            key={fa.paymentId}
            fa={fa}
            owner={props.owner}
            mayWrite={props.mayWrite}
            fiscalCompleto={props.fiscalCompleto}
          />
        ))}
      </ul>
    </>
  );
}

export function Facturas(props: { readonly r: ListarFacturasResult } & Permisos) {
  return (
    <section className={f.panel} aria-labelledby="fac-t">
      <div className={f.head}>
        <h2 id="fac-t" className={f.titulo}>
          Facturas
        </h2>
        <span className={nota}>Cada cobro de tu plan con su CFDI.</span>
        {props.owner && !props.fiscalCompleto ? (
          <Link href="/negocio" className={f.fiscal}>
            Sin datos fiscales: salen a público en general.
            <span className={f.fiscalLink}>Completar</span>
          </Link>
        ) : null}
      </div>
      <Cuerpo {...props} />
    </section>
  );
}
