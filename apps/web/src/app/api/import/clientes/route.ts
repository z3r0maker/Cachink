import { NextResponse } from 'next/server';

import { TEMPLATE_HEADERS } from '@/lib/import-clientes';
import { buildSheet } from '@/server/export/workbook';
import { readSession } from '@/server/session';

/**
 * `GET /api/import/clientes` — the Clientes import template (N-16). Headers
 * come from the parser's own `TEMPLATE_HEADERS`, so the template and the
 * parser cannot disagree. One example row.
 */
type Header = (typeof TEMPLATE_HEADERS)[number];

const EXAMPLE: Record<Header, string> = {
  nombre: 'Doña Mary',
  telefono: '55 1234 5678',
  rfc: 'XAXX010101000',
};

export async function GET(): Promise<NextResponse> {
  if ((await readSession()) === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const columns = TEMPLATE_HEADERS.map((h) => ({ header: h, value: (r: typeof EXAMPLE) => r[h] }));
  const bytes = await buildSheet('Clientes', columns, [EXAMPLE]);
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-clientes.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
