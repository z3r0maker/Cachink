import { isNull } from 'drizzle-orm';
import { clients as clientsTable } from '@xangarro/data-pg';

import { saldosActuales } from '@/server/actions/apertura';
import { requireMember } from '@/server/auth';
import { withTenant } from '@/server/db';

import { SaldosScreen, type ClienteOpcion } from './parts';

/**
 * Saldos iniciales (N-17). Owner and admin edit until the explicit lock; a
 * viewer reads. Linked from Negocio and the «¿Cómo empiezo?» checklist.
 */
export default async function SaldosInicialesPage() {
  const session = await requireMember('viewer');

  const { header, lines } = await saldosActuales(session.business_id);
  const clientes: readonly ClienteOpcion[] = await withTenant(session.business_id, (tx) =>
    tx
      .select({ id: clientsTable.id, nombre: clientsTable.nombre, telefono: clientsTable.telefono })
      .from(clientsTable)
      .where(isNull(clientsTable.deletedAt))
      .orderBy(clientsTable.nombre),
  );

  return (
    <SaldosScreen
      mayWrite={session.member_role !== 'viewer'}
      lockedAt={header?.lockedAt ?? null}
      clientes={clientes}
      form={{
        fechaApertura: header?.fechaApertura ?? '',
        caja: centavos(header?.cajaCentavos ?? 0n),
        bancos: centavos(header?.bancosCentavos ?? 0n),
        lines: lines.map((l) => ({ clienteId: l.clienteId, saldo: centavos(l.saldoCentavos) })),
      }}
    />
  );
}

function centavos(c: bigint): string {
  const whole = c / 100n;
  const cents = (c % 100n).toString().padStart(2, '0');
  return `${whole}.${cents}`;
}
