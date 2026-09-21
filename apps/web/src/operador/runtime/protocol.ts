/**
 * The Worker's wire protocol (O-06/O-12), shared by both ends so a method can
 * never drift: the request union the client posts, the response envelope it
 * resolves, and the per-method payloads.
 */

import type { RegistrarTicketInput } from '@xangarro/application';
import type { ReferenceTables } from '@xangarro/contracts';

export type {
  AbonoCuentaPara,
  CierrePara,
  CuentaPara,
  GastoPara,
  LineaPara,
  TicketPara,
  VentaCuentaPara,
  VentaPara,
} from './shapes';

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

/** A fiado ticket of an account, and an abono on it (O-33; money as centavos string). */

/** One line of a ticket, as Detalle de venta shows it (O-34). */

/** The open turno's close figures (O-36): the four parts and the resumen. */

/** One petty-cash expense of the open turno, as Gastos lists it (O-35). */

/** The open turno's ticket by folio, with everything the detail screen needs. */

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
      readonly method: 'ticket';
      readonly businessId: string;
      readonly deviceId: string;
      readonly folio: number;
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
      readonly method: 'gastos';
      readonly businessId: string;
      readonly deviceId: string;
      readonly turnoId: string;
    }
  | {
      readonly id: number;
      readonly method: 'gastar';
      readonly businessId: string;
      readonly deviceId: string;
      readonly userId: string;
      readonly turnoId: string;
      readonly concepto: string;
      /** The operator's category word; the worker maps it to the domain's. */
      readonly categoria: string;
      readonly montoCentavos: string;
      readonly proveedor: string | null;
    }
  | {
      readonly id: number;
      readonly method: 'cierre';
      readonly businessId: string;
      readonly deviceId: string;
      readonly turnoId: string;
    }
  | {
      readonly id: number;
      readonly method: 'cerrar';
      readonly businessId: string;
      readonly deviceId: string;
      readonly turnoId: string;
      readonly montoCierreCentavos: string;
      /** The domain's six-value enum, already mapped from the screen's word. */
      readonly discrepancyReason: string | null;
      readonly explicacion: string | null;
      /** The count by denomination ("200": 2), written once at close. */
      readonly denominaciones: Readonly<Record<string, number>> | null;
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
