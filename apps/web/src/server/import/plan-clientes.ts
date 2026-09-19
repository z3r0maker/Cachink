import 'server-only';

import { isNull } from 'drizzle-orm';
import { clients } from '@xangarro/data-pg';

import { parseClientSheet } from '@/lib/import-clientes';
import { planImportClientes, type ExistingClient } from '@/lib/import-plan-clientes';

import type { Tx } from '../db';
import { readSheet, SheetError } from './read-sheet';

/**
 * Read, parse and plan an uploaded Clientes sheet inside the tenant
 * transaction (N-16) — the clientes twin of `plan-productos`. The preview and
 * the commit both call this, so what gets written is always re-derived on the
 * server from the file, never from a preview the browser sent back.
 */
export async function existingClients(tx: Tx): Promise<readonly ExistingClient[]> {
  const rows = await tx
    .select({
      id: clients.id,
      nombre: clients.nombre,
      telefono: clients.telefono,
      rfc: clients.rfc,
    })
    .from(clients)
    .where(isNull(clients.deletedAt));
  return rows;
}

export async function planClientsFromFile(
  tx: Tx,
  file: File,
): Promise<ReturnType<typeof planImportClientes>> {
  const parsed = parseClientSheet(await readSheet(file));
  if (!parsed.ok) throw new SheetError(parsed.message);
  return planImportClientes(parsed.rows, await existingClients(tx));
}
