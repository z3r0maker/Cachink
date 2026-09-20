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
    };

export type WorkerResponse =
  | { readonly id: number; readonly ok: true; readonly data: unknown }
  | { readonly id: number; readonly ok: false; readonly error: string };
