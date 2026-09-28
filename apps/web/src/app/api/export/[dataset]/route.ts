import { NextResponse } from 'next/server';

import { readSession } from '@/server/session';
import { buildExport, isDataset } from '@/server/export/datasets';
import { takeExport } from '@/server/export/limit';

/**
 * `GET /api/export/<dataset>` → an .xlsx download, **streamed** (DB3-EXP-01):
 * the body is written batch by batch as the rows are read, so a year of a
 * busy business costs the function about one batch of memory, not gigabytes.
 *
 * A route handler rather than a server action because the result is a *file*:
 * the browser needs a real response with `Content-Disposition` so the download
 * carries a filename, and an action returns a value to JavaScript instead.
 *
 * It is a read, so `viewer` may use it — exporting is open to every role
 * including the contador, which `canExport()` already says. What it is not is
 * public: the dataset name arrives in the URL, so it is checked against a
 * closed union before it reaches a query, and the tenant comes from the signed
 * cookie rather than from anything the caller can type. Nor is it free: a
 * business gets five exports every ten minutes (`limit.ts`), then 429.
 */

/** Seconds. A million-row file is a minute or two of reading; this is the ceiling, not the plan. */
export const maxDuration = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> },
): Promise<Response> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { dataset } = await params;
  if (!isDataset(dataset)) {
    return NextResponse.json({ error: `No exportamos "${dataset}"` }, { status: 404 });
  }

  const wait = await takeExport(session.business_id);
  if (wait > 0) {
    return NextResponse.json(
      { error: 'Hiciste varias exportaciones seguidas. Intenta de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(wait) } },
    );
  }

  const { filename, body } = await buildExport(dataset, session.business_id);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // An export is a snapshot of live rows; a cached one is a stale one.
      'Cache-Control': 'no-store',
    },
  });
}
