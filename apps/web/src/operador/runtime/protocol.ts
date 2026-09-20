/**
 * The Worker's wire protocol (O-06/O-12), shared by both ends so a method can
 * never drift: the request union the client posts, the response envelope it
 * resolves, and the per-method payloads.
 */

import type { RegistrarTicketInput } from '@xangarro/application';
import type { ReferenceTables } from '@xangarro/contracts';

export interface RegistrarContext {
  readonly deviceId: string;
  readonly userId: string | null;
  readonly stockEnabled: boolean;
}

export interface BootInfo {
  /** True when no OPFS database existed and the journal just applied. */
  readonly fresh: boolean;
}

export interface OperadorPara {
  readonly id: string;
  readonly nombre: string;
  readonly avatarColor: string;
}

export interface SesionAbierta {
  readonly userId: string;
  readonly turnoId: string;
}

/** One ticket of the open turno, as Operador · Ventas lists it (money as centavos string). */
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

/** A fiado ticket of an account, and an abono on it (O-33; money as centavos string). */
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

export type WorkerRequest =
  | { readonly id: number; readonly method: 'boot' }
  | {
      readonly id: number;
      readonly method: 'registrar';
      readonly input: RegistrarTicketInput;
      readonly ctx: RegistrarContext;
    }
  | { readonly id: number; readonly method: 'sync'; readonly token: string | null }
  | { readonly id: number; readonly method: 'counts' }
  | {
      readonly id: number;
      readonly method: 'vincular';
      readonly tables: ReferenceTables;
      readonly businessId: string;
    }
  | {
      readonly id: number;
      readonly method: 'operadores';
      readonly businessId: string;
      readonly deviceId: string;
    }
  | {
      readonly id: number;
      readonly method: 'autenticar';
      readonly businessId: string;
      readonly deviceId: string;
      readonly nombre: string;
      readonly nip: string;
    }
  | {
      readonly id: number;
      readonly method: 'abrirCaja';
      readonly businessId: string;
      readonly deviceId: string;
      readonly userId: string;
      readonly fondoCentavos: string;
    }
  | {
      readonly id: number;
      readonly method: 'turnoAbierto';
      readonly businessId: string;
      readonly deviceId: string;
    }
  | {
      readonly id: number;
      readonly method: 'productos';
      readonly businessId: string;
      readonly deviceId: string;
    }
  | {
      readonly id: number;
      readonly method: 'ventas';
      readonly businessId: string;
      readonly deviceId: string;
      readonly turnoId: string;
    }
  | {
      readonly id: number;
      readonly method: 'cancelar';
      readonly businessId: string;
      readonly deviceId: string;
      readonly userId: string;
      readonly ticketId: string;
      readonly pin: string;
      readonly motivo: string;
    }
  | {
      readonly id: number;
      readonly method: 'cuentas';
      readonly businessId: string;
      readonly deviceId: string;
    }
  | {
      readonly id: number;
      readonly method: 'abonar';
      readonly businessId: string;
      readonly deviceId: string;
      readonly clienteId: string;
      readonly montoCentavos: string;
      readonly metodo: string;
      readonly fecha: string;
    };

export type WorkerResponse =
  | { readonly id: number; readonly ok: true; readonly data: unknown }
  | { readonly id: number; readonly ok: false; readonly error: string };
