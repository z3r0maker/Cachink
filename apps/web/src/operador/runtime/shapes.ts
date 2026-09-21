/**
 * The Worker's response payload shapes (O-32 → O-36): what each read hands
 * the main thread — money always as centavos strings, ids as plain strings.
 * Kept beside `protocol.ts`'s unions so neither file outgrows its budget.
 */

export interface VentaPara {
  readonly id: string;
  readonly folio: number;
  readonly concepto: string;
  readonly montoCentavos: string;
  readonly metodo: string;
  readonly hora: string;
  readonly cliente: string | null;
  readonly cancelada: string | null;
}

export interface VentaCuentaPara {
  readonly folio: number;
  readonly concepto: string;
  /** Naive local "YYYY-MM-DDTHH:MM". */
  readonly fecha: string;
  readonly montoCentavos: string;
  readonly capturo: string;
}

export interface AbonoCuentaPara {
  readonly id: string;
  /** IsoDate — abonos are day-granular. */
  readonly fecha: string;
  readonly montoCentavos: string;
  readonly metodo: string;
  readonly nota: string | null;
}

export interface CuentaPara {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string | null;
  readonly creado: string;
  readonly limiteCentavos: string | null;
  readonly plazoDias: number | null;
  /** The domain's derivation over the account's two facts (ADR-074). */
  readonly saldoCentavos: string;
  readonly ventas: readonly VentaCuentaPara[];
  readonly abonos: readonly AbonoCuentaPara[];
}

export interface LineaPara {
  readonly productoId: string;
  readonly nombre: string;
  readonly precioCentavos: string;
  readonly cantidad: number;
  readonly categoria: string;
}

export interface TicketPara {
  readonly id: string;
  readonly folio: number;
  readonly fecha: string;
  readonly hora: string;
  readonly metodo: string;
  readonly lineas: readonly LineaPara[];
  readonly recibidoCentavos: string | null;
  readonly cambioCentavos: string | null;
  readonly cliente: string | null;
  readonly clienteSaldoCentavos: string | null;
  readonly cancelada: string | null;
}

export interface GastoPara {
  readonly id: string;
  readonly concepto: string;
  readonly montoCentavos: string;
  /** The domain's stored category; the screen says its own word. */
  readonly categoria: string;
  readonly hora: string;
  readonly proveedor: string | null;
}

export interface CierrePara {
  readonly desde: string;
  readonly cerrado: boolean;
  readonly fondoCentavos: string;
  readonly ventasEfectivoCentavos: string;
  readonly abonosEfectivoCentavos: string;
  readonly gastosEfectivoCentavos: string;
  /** The one calculator's answer (O-03) — the parts are its display. */
  readonly esperadoCentavos: string;
  readonly resumen: {
    readonly ventas: number;
    readonly cobradoCentavos: string;
    readonly canceladas: number;
    readonly canceladoCentavos: string;
    readonly fiadoCentavos: string;
    readonly entradas: number;
    readonly mermas: number;
  };
}
