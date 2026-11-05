import { NextResponse } from 'next/server';

import { NotPermitted, requireMember } from '@/server/auth';
import { negociosOf } from '@/server/memberships';
import { readSession } from '@/server/session';
import { takeExport } from '@/server/export/limit';
import { buildTodo } from '@/server/export/todo';

/**
 * `GET /api/export/todo` → «Descargar todo»: the business's five workbooks and
 * `datos.json` in one .zip, streamed (`server/export/todo.ts`).
 *
 * **Owner only**, unlike the per-screen exports a contador may take: this is
 * everything (the team, the devices, every operador) and it is the first step
 * of closing the account, which is the owner's alone. The tenant is the signed
 * session's, or `?negocio=` naming another business the same account owns
 * (the deletion page lists every one, ADR-136). It counts as one export against the business's
 * allowance (`limit.ts`), checked after the role so a refused caller never
 * spends it.
 */

/** Seconds. The whole history of a busy business is the longest read the portal makes. */
export const maxDuration = 300;

/** The business to export: the session's, or another the account owns; `null` when it owns none. */
async function negocioPedido(request: Request, session: { sub: string; business_id: string }) {
  const pedido = new URL(request.url).searchParams.get('negocio');
  if (pedido === null || pedido === session.business_id) return session.business_id;
  const propios = await negociosOf(session.sub);
  return propios.some((n) => n.businessId === pedido && n.role === 'owner') ? pedido : null;
}

const SOLO_DUENO = () =>
  NextResponse.json({ error: 'Solo el dueño del negocio puede descargar todo.' }, { status: 403 });

export async function GET(request: Request): Promise<Response> {
  if ((await readSession()) === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  let businessId: string | null;
  try {
    businessId = await negocioPedido(request, await requireMember('owner'));
  } catch (error) {
    if (!(error instanceof NotPermitted)) throw error;
    return SOLO_DUENO();
  }
  if (businessId === null) return SOLO_DUENO();

  const wait = await takeExport(businessId);
  if (wait > 0) {
    return NextResponse.json(
      { error: 'Hiciste varias exportaciones seguidas. Intenta de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(wait) } },
    );
  }

  const { filename, body } = await buildTodo(businessId);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
