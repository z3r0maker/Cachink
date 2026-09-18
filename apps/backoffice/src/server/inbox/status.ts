import {
  CfdiUuidSchema,
  SupportStatusSchema,
  type SupportItem,
  type SupportStatus,
} from '@xangarro/domain';

import { invalid, store, SupportItemError } from './errors';
import { loadItem, type Clock } from './load';
import type { SupportItemRepository } from './port';

export interface StatusInput {
  readonly id: unknown;
  readonly status: unknown;
  /** Folio fiscal; `factura` items only, required to resolve one. */
  readonly cfdiUuid?: string | null;
}

export interface StatusResult {
  readonly item: SupportItem;
  readonly previousStatus: SupportStatus;
}

function parseUuid(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null || raw.trim() === '') return null;
  const parsed = CfdiUuidSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SupportItemError(
      'INVALID_CFDI_UUID',
      'El UUID del CFDI no tiene el formato del SAT.',
    );
  }
  return parsed.data;
}

/** The folio fiscal the item ends up with, enforcing the factura rules. */
function nextUuid(item: SupportItem, status: SupportStatus, given: string | null): string | null {
  if (item.kind !== 'factura') {
    if (given !== null) throw invalid('Solo un item de factura lleva UUID de CFDI.');
    return null;
  }
  const uuid = given ?? item.cfdiUuid;
  if (status === 'resuelto' && uuid === null) {
    throw new SupportItemError(
      'CFDI_UUID_REQUIRED',
      'Para resolver un pago sin CFDI escribe el UUID del CFDI que emitiste.',
    );
  }
  return uuid;
}

/**
 * `changeSupportItemStatus` — move an item between nuevo, en curso and
 * resuelto (N-08). Resolving stamps `resolvedAt`; reopening clears it. A
 * `factura` item ("pago sin CFDI", ADR-070) resolves only with its folio fiscal.
 */
export async function changeSupportItemStatus(
  repo: SupportItemRepository,
  input: StatusInput,
  clock: Clock,
): Promise<StatusResult> {
  const status = SupportStatusSchema.safeParse(input.status);
  if (!status.success) throw invalid('Estado inválido.');
  const given = parseUuid(input.cfdiUuid);
  const before = await loadItem(repo, input.id);
  const cfdiUuid = nextUuid(before, status.data, given);
  const at = clock.now().toISOString();
  const resolvedAt = status.data === 'resuelto' ? (before.resolvedAt ?? at) : null;
  const item: SupportItem = { ...before, status: status.data, cfdiUuid, resolvedAt, updatedAt: at };
  await store(() => repo.update(item));
  return { item, previousStatus: before.status };
}
