/**
 * SolicitarImportacionAsistidaUseCase (N-18): the tenant's «Hazlo por mí»
 * request — what they use today, what they want migrated, and their files.
 * One request in flight per business; paid plans only (xangarrito gets the
 * upsell, never the form). Files: 1–5, ≤ 20 MB each, .xlsx/.csv — the same
 * shapes the self-service import accepts, because staff will map into them.
 */

import {
  ImportacionAsistidaInvalida,
  ImportacionAsistidaNoDisponible,
  ImportacionAsistidaYaActiva,
} from '@xangarro/domain';
import type { UseCase } from '../_use-case.js';

export interface ArchivoSolicitud {
  readonly filename: string;
  readonly mime: string;
  readonly bytes: Uint8Array;
}

export interface AssistedImportsPort {
  hasActive(businessId: string): Promise<boolean>;
  create(input: {
    readonly businessId: string;
    readonly sistemaActual: string;
    readonly notas: string;
    readonly requestedBy: string | null;
    readonly files: readonly ArchivoSolicitud[];
  }): Promise<{ readonly id: string }>;
}

export interface SolicitarImportacionInput {
  readonly businessId: string;
  readonly paid: boolean;
  readonly sistemaActual: string;
  readonly notas: string;
  readonly requestedBy: string | null;
  readonly files: readonly ArchivoSolicitud[];
}

export const MAX_SOLICITUD_FILES = 5;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIMES = new Set([
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export class SolicitarImportacionAsistidaUseCase implements UseCase<
  SolicitarImportacionInput,
  { readonly id: string }
> {
  constructor(private readonly port: AssistedImportsPort) {}

  async execute(input: SolicitarImportacionInput): Promise<{ readonly id: string }> {
    if (!input.paid) throw new ImportacionAsistidaNoDisponible();
    if (await this.port.hasActive(input.businessId)) throw new ImportacionAsistidaYaActiva();

    const campos: string[] = [];
    const sistema = input.sistemaActual.trim();
    if (sistema === '' || sistema.length > 120) campos.push('sistema actual');
    if (input.notas.trim().length > 2000) campos.push('qué datos');
    if (input.files.length === 0) campos.push('archivos');
    if (input.files.length > MAX_SOLICITUD_FILES)
      campos.push(`máximo ${MAX_SOLICITUD_FILES} archivos`);
    input.files.forEach((f, i) => {
      if (!MIMES.has(f.mime)) campos.push(`archivo ${i + 1}: solo .xlsx o .csv`);
      if (f.bytes.byteLength === 0 || f.bytes.byteLength > MAX_FILE_BYTES) {
        campos.push(`archivo ${i + 1}: entre 1 byte y 20 MB`);
      }
    });
    if (campos.length > 0) throw new ImportacionAsistidaInvalida(campos);

    return this.port.create({
      businessId: input.businessId,
      sistemaActual: sistema,
      notas: input.notas.trim(),
      requestedBy: input.requestedBy,
      files: input.files,
    });
  }
}
