/**
 * `GET /api/cron/agenda` — Vercel Cron calls it daily at 14:00 UTC (08:00 in
 * Mexico City). It answers only `Authorization: Bearer $CRON_SECRET`, like the
 * staff digest, and sends each founder one email with what falls due in 7, 3
 * or 1 days (E-04). One email per founder per day: a re-run sends nothing new.
 */
import type { ObligacionVista } from '@xangarro/application/corp';
import type { EmailSender } from '@xangarro/application/email';
import { renderGenericNoticeEmail } from '@xangarro/email';

import { secretMatches } from '../ingest/secret';
import { correoDe, recordatoriosDe, type Recordatorio } from './recordatorios';

export interface Destinatario {
  readonly founderId: string;
  readonly email: string;
}

export interface AgendaCronDeps {
  readonly secret: string | undefined;
  readonly hoy: () => string;
  /** Null when the corp database is not configured: nothing to remind. */
  readonly leer: ((hoy: string) => Promise<readonly ObligacionVista[]>) | null;
  readonly destinatarios: () => Promise<readonly Destinatario[]>;
  readonly sender: EmailSender;
  readonly consoleUrl: string;
  readonly log?: (message: string, error: unknown) => void;
}

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

function bearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

async function enviar(
  deps: AgendaCronDeps,
  hoy: string,
  recordatorios: readonly Recordatorio[],
  para: readonly Destinatario[],
): Promise<number> {
  const log = deps.log ?? console.error;
  const content = await renderGenericNoticeEmail(correoDe(recordatorios, deps.consoleUrl));
  let sent = 0;
  for (const d of para) {
    const result = await deps.sender.send({
      to: d.email,
      ...content,
      tags: [{ name: 'kind', value: 'corp-agenda' }],
      idempotencyKey: `corp-agenda:${d.founderId}:${hoy}`,
    });
    if (result.ok) sent += 1;
    else log(`agenda: sending to founder ${d.founderId} failed`, result.error);
  }
  return sent;
}

export async function handleAgendaCron(req: Request, deps: AgendaCronDeps): Promise<Response> {
  if (!deps.secret) return reply(503, { error: 'cron_disabled' });
  if (!secretMatches(bearer(req), deps.secret)) return reply(401, { error: 'unauthorized' });
  if (deps.leer === null) return reply(200, { ok: true, sent: 0, reason: 'corp_disabled' });
  const hoy = deps.hoy();
  let recordatorios: readonly Recordatorio[];
  let para: readonly Destinatario[];
  try {
    recordatorios = recordatoriosDe(await deps.leer(hoy), hoy);
    para = recordatorios.length === 0 ? [] : await deps.destinatarios();
  } catch (error) {
    (deps.log ?? console.error)('agenda: reading failed', error);
    return reply(500, { error: 'store_failed' });
  }
  if (recordatorios.length === 0) return reply(200, { ok: true, sent: 0, due: 0 });
  const sent = await enviar(deps, hoy, recordatorios, para);
  const ok = sent === para.length;
  return reply(ok ? 200 : 502, { ok, sent, due: recordatorios.length });
}
