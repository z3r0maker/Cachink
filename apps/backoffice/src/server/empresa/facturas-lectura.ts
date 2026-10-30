import {
  createCorporativoRepository,
  createReceivedInvoiceRepository,
  facturasDelMes,
  listMovimientos,
  type CorpDb,
  type FacturaDelMes,
  type Movimiento,
} from '@xangarro/data-corp';

import { requireCorpDb } from '../db/corp';
import { esSinCfdi } from './facturas-view';
import { panelXml, type PanelXml } from './registrar-xml-view';
import { tarjetaDe, type TarjetaRevision } from './revision-view';

/**
 * What Facturas reads (E-11): the month's received invoices plus the
 * expenses registered without an XML (board CD-06b), and what waits for
 * review, each with its supplier's remembered category (board CD-06c).
 */
export interface MesDeFacturas {
  readonly facturas: readonly FacturaDelMes[];
  readonly sinCfdi: readonly Movimiento[];
}

export async function leerFacturas(mes: string): Promise<MesDeFacturas> {
  const db = requireCorpDb();
  const [facturas, movimientos] = await Promise.all([
    facturasDelMes(db, mes),
    listMovimientos(db, mes),
  ]);
  return { facturas, sinCfdi: movimientos.filter(esSinCfdi) };
}

export async function leerRevision(): Promise<readonly TarjetaRevision[]> {
  const facturas = createReceivedInvoiceRepository(requireCorpDb());
  const pendientes = await facturas.porRevisar();
  return Promise.all(
    pendientes.map(async (f) => tarjetaDe(f, await facturas.recordadaPara(f.cfdi.emisor.rfc))),
  );
}

/** The XML attached on Registrar gasto (board CD-06d), while it still waits; else null. */
export async function leerPanelXml(uuid: string): Promise<PanelXml | null> {
  const facturas = createReceivedInvoiceRepository(requireCorpDb());
  const f = await facturas.porUuid(uuid);
  if (f === null || f.estado !== 'por_revisar') return null;
  return panelXml(f, await facturas.recordadaPara(f.cfdi.emisor.rfc));
}

/** MEXIA's RFC as the founders recorded it in Corporativo (E-06), or null. */
export async function rfcDeMexia(db: CorpDb): Promise<string | null> {
  const registro = await createCorporativoRepository(db).registro('rfc');
  const rfc = registro?.referencia?.trim().toUpperCase() ?? '';
  return rfc === '' ? null : rfc;
}
