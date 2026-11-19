import { formatMoney } from '@xangarro/domain';
import {
  ultimoDia,
  type EstadoPaso,
  type PasoCierre,
  type PasoDelCierre,
} from '@xangarro/domain/corp';

import { hrefCierre, type DetalleCierre } from './cierre-view';
import { facturasHref } from './facturas-rutas';
import { fechaCorta, fechaLarga, nombreMes, sumarDias } from './fechas';

/**
 * The seven steps as board CD-10 words them: what each found, where it comes
 * from, and the button to go and fix it. The bank balance opens its panel
 * and the statements upload here; every other step links to its screen.
 */
export interface Accion {
  readonly texto: string;
  readonly href: string;
  readonly primaria: boolean;
}

export interface PasoVista {
  readonly id: PasoCierre;
  readonly n: number;
  readonly titulo: string;
  readonly detalle: string;
  readonly fuente: string;
  readonly estado: EstadoPaso;
  readonly accion: Accion | null;
  /** Step 7 uploads in place while it is pending. */
  readonly subir: boolean;
}

type Texto = Omit<PasoVista, 'id' | 'n' | 'estado' | 'subir'>;

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const ver = (texto: string, href: string): Accion => ({ texto, href, primaria: false });

function emitidas(d: DetalleCierre, mes: string, e: EstadoPaso): Texto {
  const g = d.emitidas.global;
  const faltan = [
    ...(g !== null && !g.timbrada ? [`falta timbrar la global de ${nombreMes(mes)}`] : []),
    ...(d.emitidas.porEmitir > 0
      ? [plural(d.emitidas.porEmitir, 'pago por facturar', 'pagos por facturar')]
      : []),
  ];
  const hecho =
    g === null
      ? 'Cada pago tiene su CFDI'
      : `Timbrada · ${plural(g.pagos, 'pago', 'pagos')} · ${g.total} a «Público en general»`;
  return {
    titulo: `Factura global de ${nombreMes(mes)}`,
    detalle:
      e === 'no_aplica'
        ? 'Sin pagos de «Público en general» en el mes'
        : e === 'hecho'
          ? hecho
          : `Falta: ${faltan.join(' y ')}`,
    fuente: 'Facturas',
    accion:
      e === 'no_aplica' ? null : ver('Ver en Facturas', `/empresa/facturas/emitidas?mes=${mes}`),
  };
}

function ingresos(d: DetalleCierre, mes: string, e: EstadoPaso): Texto {
  const { pagos, sinImportar, cobradoSinIva } = d.emitidas;
  return {
    titulo: 'Ingresos del mes',
    detalle:
      e === 'no_aplica'
        ? 'Sin cobros en el mes'
        : e === 'hecho'
          ? `${plural(pagos, 'cobro importado', 'cobros importados')} · ${formatMoney(cobradoSinIva)} sin IVA`
          : `Falta: ${plural(sinImportar, 'cobro sin importar', 'cobros sin importar')}; se importan cada mañana`,
    fuente: 'Movimientos',
    accion:
      e === 'no_aplica'
        ? null
        : ver('Ver los ingresos', `/empresa/movimientos?mes=${mes}&ver=ingresos`),
  };
}

function recibidas(d: DetalleCierre, mes: string, e: EstadoPaso): Texto {
  const r = d.recibidas;
  const sin = r.sinFactura.slice(0, 3).map((g) => g.concepto);
  const faltan = [
    ...(r.sinFactura.length > 0
      ? [
          `${plural(r.sinFactura.length, 'gasto sin factura', 'gastos sin factura')}: ${sin.join(', ')}${r.sinFactura.length > 3 ? '…' : ''}`,
        ]
      : []),
    ...(r.porRevisar > 0 ? [plural(r.porRevisar, 'XML por revisar', 'XML por revisar')] : []),
  ];
  const conFactura = r.gastos - r.noDeducibles;
  const hecho = [
    ...(conFactura > 0
      ? [plural(conFactura, 'gasto con su factura', 'gastos con su factura')]
      : []),
    ...(r.noDeducibles > 0
      ? [plural(r.noDeducibles, 'marcado no deducible', 'marcados no deducibles')]
      : []),
  ].join(' · ');
  return {
    titulo: 'Facturas recibidas',
    detalle:
      e === 'no_aplica'
        ? 'Sin gastos en el mes'
        : e === 'hecho'
          ? hecho
          : `Falta: ${faltan.join(' · ')}`,
    fuente: 'Facturas',
    accion: e === 'no_aplica' ? null : ver('Ver en Facturas', facturasHref(mes, {})),
  };
}

function banco(d: DetalleCierre, mes: string, e: EstadoPaso): Texto {
  const { consola, confirmado } = d.banco;
  const pendiente =
    confirmado === null
      ? `Falta: escribe el saldo del estado de cuenta y compáralo con el de aquí, ${formatMoney(consola)}`
      : `Lo confirmado (${formatMoney(confirmado)}) ya no es el saldo de aquí (${formatMoney(consola)}): confírmalo otra vez`;
  return {
    titulo: `Saldo del banco al ${fechaCorta(ultimoDia(mes))}`,
    detalle:
      e === 'hecho'
        ? `Confirmado · ${formatMoney(consola)}, igual que el estado de cuenta`
        : pendiente,
    fuente: 'Tú',
    accion:
      e === 'hecho'
        ? null
        : { texto: 'Confirmar saldo', href: hrefCierre(mes, 'banco'), primaria: true },
  };
}

function impuestos(d: DetalleCierre, mes: string, e: EstadoPaso): Texto {
  const o = d.impuestos;
  const siguiente = nombreMes(sumarDias(`${mes}-28`, 4).slice(0, 7));
  const hecho =
    o?.estado === 'pagada'
      ? 'Presentada y pagada'
      : `Presentada con su acuse · el pago cae en ${siguiente}`;
  return {
    titulo: `ISR e IVA de ${nombreMes(mes)}`,
    detalle:
      e === 'no_aplica'
        ? 'Antes del registro ante el SAT no se declara'
        : e === 'hecho'
          ? hecho
          : `Falta: presentarla con su acuse${o === null ? '' : ` · vence el ${fechaLarga(o.vence)}`}`,
    fuente: 'Impuestos',
    accion: e === 'no_aplica' ? null : ver('Ver en Impuestos', `/empresa/impuestos?mes=${mes}`),
  };
}

function agenda(d: DetalleCierre, mes: string, e: EstadoPaso): Texto {
  const { otras, exentas } = d.agenda;
  const exentasTexto = exentas.length === 0 ? '' : ` · ${exentas.join(' y ')}: exenta`;
  const pendientes = otras.filter((o) => !o.cumplida).map((o) => o.titulo);
  return {
    titulo: `El resto de la Agenda de ${nombreMes(mes)}`,
    detalle:
      e === 'no_aplica'
        ? `Sin otras obligaciones en el mes${exentasTexto}`
        : e === 'hecho'
          ? `${otras.map((o) => o.titulo).join(' y ')}: al día${exentasTexto}`
          : `Falta: ${pendientes.join(' y ')}`,
    fuente: 'Agenda',
    accion: ver('Ver en Agenda', '/empresa/agenda'),
  };
}

function estados(d: DetalleCierre, _mes: string, e: EstadoPaso): Texto {
  const doc = d.estados;
  return {
    titulo: 'Estados financieros del contador',
    detalle:
      e === 'hecho' && doc !== null
        ? `${doc.nombre} · subidos el ${fechaCorta(doc.subidoEn.slice(0, 10))} · en Expediente`
        : 'Falta: súbelos cuando los mande el contador',
    fuente: 'Tú',
    accion: doc === null ? null : ver('Ver', `/empresa/documentos/${doc.id}`),
  };
}

const TEXTOS: Record<PasoCierre, (d: DetalleCierre, mes: string, e: EstadoPaso) => Texto> = {
  emitidas,
  ingresos,
  recibidas,
  banco,
  impuestos,
  agenda,
  estados,
};

/** In a closed month nothing is fixed from here: only the links to look stay. */
export function pasosVista(
  pasos: readonly PasoDelCierre[],
  d: DetalleCierre,
  mes: string,
  cerrado: boolean,
): readonly PasoVista[] {
  return pasos.map((p, i) => {
    const t = TEXTOS[p.id](d, mes, p.estado);
    const accion = cerrado && t.accion?.primaria === true ? null : t.accion;
    return {
      ...t,
      accion,
      id: p.id,
      n: i + 1,
      estado: p.estado,
      subir: p.id === 'estados' && !cerrado,
    };
  });
}
