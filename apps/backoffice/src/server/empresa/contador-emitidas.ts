import type { IngresoDelPeriodo } from '@xangarro/data-pg';
import type { CfdiEmitido } from '@xangarro/domain/corp';

import { fechaEnMexico } from './fechas';

/**
 * The month's issued CFDIs for the contador's package (E-43): each payment's
 * nominative invoice and its payment complement, and the month's global to
 * «Público en general» once stamped. The console keeps their folio fiscal,
 * not their XML (staff stamp them in the SAT's portal, ADR-070), so the
 * package lists them; a cancelled one is left out. Pure.
 */
export interface EmitidasDelPaquete {
  readonly cfdis: readonly CfdiEmitido[];
  /** Invoices to a customer, complements apart. */
  readonly nominativas: number;
  readonly global: 'timbrada' | 'por_timbrar' | null;
}

const PUBLICO = { rfc: 'XAXX010101000', nombre: 'Público en general' } as const;

function nominativos(i: IngresoDelPeriodo): CfdiEmitido[] {
  if (i.route === 'global' || i.status === 'cancelled' || i.invoiceUuid === null) return [];
  const base = {
    rfc: i.receptorRfc ?? '',
    nombre: i.receptorNombre ?? '',
    fecha: fechaEnMexico(i.paidAt),
    total: i.totalCentavos,
  };
  const factura = { ...base, uuid: i.invoiceUuid, tipo: 'Factura' };
  return i.complementUuid === null
    ? [factura]
    : [factura, { ...base, uuid: i.complementUuid, tipo: 'Complemento de pago' }];
}

function globalDe(ingresos: readonly IngresoDelPeriodo[]) {
  const pagos = ingresos.filter(
    (i) => i.route === 'global' && (i.status === 'pending_global' || i.status === 'in_global'),
  );
  if (pagos.length === 0) return { estado: null, cfdi: null } as const;
  const uuid = pagos[0]?.globalUuid ?? null;
  const timbrada =
    uuid !== null && pagos.every((i) => i.status === 'in_global' && i.globalUuid === uuid);
  if (!timbrada) return { estado: 'por_timbrar', cfdi: null } as const;
  const total = pagos.reduce((t, i) => t + i.totalCentavos, 0n);
  const cfdi: CfdiEmitido = { uuid, tipo: 'Factura global', ...PUBLICO, fecha: '', total };
  return { estado: 'timbrada', cfdi } as const;
}

export function emitidasDelPaquete(ingresos: readonly IngresoDelPeriodo[]): EmitidasDelPaquete {
  const propios = ingresos.flatMap(nominativos);
  const g = globalDe(ingresos);
  return {
    cfdis: g.cfdi === null ? propios : [...propios, g.cfdi],
    nominativas: propios.filter((c) => c.tipo === 'Factura').length,
    global: g.estado,
  };
}
