import { NextResponse } from 'next/server';

import { readSession } from '@/server/session';
import { informeMensualPdf } from '@/server/export/informe-mensual';
import { tenantEntitlement } from '@/server/billing/plan';
import { withTenant } from '@/server/db';
import { hoy } from '@/server/clock';

/**
 * `GET /api/export/informe-mensual?mes=YYYY-MM` → the contador's PDF (P-34).
 *
 * A route handler for the same reason the .xlsx exports are one: the response
 * is a file. Gated by `capabilities.informeMensual` (Xangarro and above,
 * ADR-090) **on the server** — the button on Estados is hidden below the
 * plan, and a direct fetch without the plan is refused here, never by the
 * UI. Open to every role: the contador is exactly who this document is for.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const mes = url.searchParams.get('mes') ?? hoy().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'mes debe ser YYYY-MM' }, { status: 400 });
  }

  const entitlement = await withTenant(session.business_id, (tx) =>
    tenantEntitlement(tx, session.business_id, new Date()),
  );
  if (!entitlement.capabilities.informeMensual) {
    return NextResponse.json(
      { error: 'El informe mensual se incluye en el plan Xangarrote.' },
      { status: 403 },
    );
  }

  const { bytes, filename } = await informeMensualPdf(session.business_id, mes);
  return new NextResponse(new Blob([bytes]), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
