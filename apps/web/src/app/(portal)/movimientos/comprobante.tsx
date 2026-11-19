'use client';

import { formatMoney } from '@xangarro/domain';
import { useState } from 'react';

import { Button } from '@/components';

import { ComprobanteCompleto } from './comprobante-completa';
import * as s from './comprobante.css';
import { detalleLinea } from './movimientos.css';
import type { Row } from './parts';

/**
 * A gasto's «Comprobante» (ADR-149, board CgPortal): the receipt photo the
 * phone pushed, with «Ver completa», or «Sin comprobante» when none arrived.
 * Whether there is one comes with the page (`receiptsOfGastos`); the bytes
 * come from `GET /api/gastos/<id>/comprobante`, versioned by the row's id so
 * a receipt that arrives later is never an old cached one.
 */
export function comprobanteUrl(gastoId: string, reciboId: string): string {
  return `/api/gastos/${encodeURIComponent(gastoId)}/comprobante?v=${encodeURIComponent(reciboId)}`;
}

/** «Foto que tomó Toni en Caja 1, a las 10:05.», saying only what is known. */
export function pieDeFoto(operador: string | null, caja: string | null, hora: string): string {
  const quien = operador === null ? 'Foto tomada' : `Foto que tomó ${operador}`;
  const donde = caja === null ? '' : ` en ${caja}`;
  return `${quien}${donde}, a las ${hora}.`;
}

/** The warning glyph (Lucide `triangle-alert`): the word carries the meaning, not the colour. */
function Alerta() {
  return (
    <svg
      className={s.avisoIcono}
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  );
}

/** Lucide `maximize-2`, as the board draws it on «Ver completa». */
const AMPLIAR = (
  <svg
    viewBox="0 0 24 24"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

function SinComprobante({ operador }: { readonly operador: string | null }) {
  const quien = operador === null ? 'No tiene foto.' : `${operador} no le tomó foto.`;
  return (
    <div className={s.aviso} data-testid="sin-comprobante">
      <Alerta />
      <span>
        <strong className={s.avisoTitulo}>Sin comprobante</strong>
        <span className={s.avisoTexto}>{`${quien} Si llega después, aparece aquí sola.`}</span>
      </span>
    </div>
  );
}

function ConFoto({
  row,
}: {
  readonly row: Row & { comprobante: NonNullable<Row['comprobante']> };
}) {
  const [completa, setCompleta] = useState(false);
  const src = comprobanteUrl(row.id, row.comprobante.id);
  const alt = `Comprobante de ${row.concepto}`;
  const caja = row.comprobante.caja ?? row.dispositivo;
  return (
    <>
      <div className={s.caja}>
        <img className={s.foto} src={src} alt={alt} data-testid="comprobante-foto" />
        <span className={s.verCompleta}>
          <Button variant="dark" size="sm" icon={AMPLIAR} onClick={() => setCompleta(true)}>
            Ver completa
          </Button>
        </span>
      </div>
      <p className={s.pie}>{pieDeFoto(row.operador, caja, row.comprobante.hora)}</p>
      <ComprobanteCompleto
        open={completa}
        onOpenChange={setCompleta}
        src={src}
        alt={alt}
        titulo={`${row.concepto} · −${formatMoney(row.amount)}`}
      />
    </>
  );
}

export function Comprobante({ row }: { readonly row: Row }) {
  if (row.kind !== 'gasto') return null;
  const { comprobante } = row;
  return (
    <section className={s.seccion} data-testid="comprobante-gasto">
      <h3 className={detalleLinea}>Comprobante</h3>
      {comprobante === null ? (
        <SinComprobante operador={row.operador} />
      ) : (
        <ConFoto row={{ ...row, comprobante }} />
      )}
    </section>
  );
}
