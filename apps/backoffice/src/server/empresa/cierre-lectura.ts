import 'server-only';

import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import {
  createCierreRepository,
  eventosDeCierre,
  listarDocumentos,
  listFounders,
  recibidasDelMes,
  saldoDeBancos,
} from '@xangarro/data-corp';
import { CATALOGO, PLANTILLA_IMPUESTOS, ultimoDia } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import { leerAgenda } from './agenda-lectura';
import type { DatosCierre, DetalleCierre } from './cierre-view';
import { leerEmitidas } from './emitidas-lectura';

/**
 * What Cierre del mes reads (E-14, board CD-10): each step's source from the
 * screen that already owns it (Emitidas, Facturas, the ledger, Impuestos'
 * Agenda row, the Expediente), the month's lock and its history.
 */
const MENSUALES = new Set(['mensual', 'fin_de_mes']);

/** Monthly obligations a RESICO persona moral is relieved of («DIOT exenta»). */
const EXENTAS = CATALOGO.filter((p) => p.exenta !== null && MENSUALES.has(p.regla.tipo)).map(
  (p) => p.titulo,
);

function estadosDe(documentos: readonly DocumentoMeta[], mes: string): DocumentoMeta | null {
  const reemplazados = new Set(
    documentos.flatMap((d) => (d.reemplazaA === null ? [] : [d.reemplazaA])),
  );
  const delMes = documentos.filter(
    (d) => d.carpeta === 'estados_financieros' && d.periodo === mes && !reemplazados.has(d.id),
  );
  return delMes.at(-1) ?? null;
}

function agendaDe(vistas: readonly ObligacionVista[], mes: string) {
  const delMes = vistas.filter((o) => o.periodo === mes && MENSUALES.has(o.plantilla.regla.tipo));
  return {
    impuestos: delMes.find((o) => o.plantilla.id === PLANTILLA_IMPUESTOS) ?? null,
    otras: delMes.filter((o) => o.plantilla.id !== PLANTILLA_IMPUESTOS),
  };
}

export async function leerDetalle(mes: string, hoy: string): Promise<DetalleCierre> {
  const db = requireCorpDb();
  const [emitidas, recibidas, consola, confirmado, agenda, documentos] = await Promise.all([
    leerEmitidas(mes),
    recibidasDelMes(db, mes),
    saldoDeBancos(db, ultimoDia(mes)),
    createCierreRepository(db).saldoConfirmado(mes),
    leerAgenda(hoy),
    listarDocumentos(db),
  ]);
  const { impuestos, otras } = agendaDe(agenda.vistas, mes);
  return {
    emitidas: {
      global: emitidas.global,
      porEmitir: emitidas.resumen.porEmitir,
      pagos: emitidas.resumen.pagos,
      sinImportar: emitidas.filas.filter((f) => f.movimiento.texto === 'Se importa mañana').length,
      cobradoSinIva: emitidas.resumen.cobradoSinIva,
    },
    recibidas,
    banco: { consola, confirmado },
    impuestos,
    agenda: { otras, exentas: EXENTAS },
    estados: estadosDe(documentos, mes),
  };
}

export async function leerCierre(mes: string, hoy: string): Promise<DatosCierre> {
  const db = requireCorpDb();
  const repo = createCierreRepository(db);
  const [detalle, eventos, cerrados, conMovimientos, socios] = await Promise.all([
    leerDetalle(mes, hoy),
    eventosDeCierre(db),
    repo.cerrados(),
    repo.conMovimientos(),
    listFounders(db),
  ]);
  return {
    mes,
    hoy,
    detalle,
    eventos,
    cerrados,
    conMovimientos,
    socios: new Map(socios.map((s) => [s.id, s.nombre])),
  };
}
