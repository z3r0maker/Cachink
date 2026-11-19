import { formatMoney } from '@xangarro/domain';
import {
  CERCA_DEL_LIMITE,
  mesMas,
  promedioMensual,
  usoDelPlan,
  type Servicio,
} from '@xangarro/domain/corp';

import { fechaCorta, nombreMes } from './fechas';
import { categoriaDe, costosDe, montoEn, type DatosServicios } from './servicios-textos';
import { graficaDe, lecturaDe, type Grafica } from './servicios-uso-view';
import { proximoTexto } from './servicios-view';

/**
 * A service's detail (E-24, board CD-18c): its three figures, each month's
 * cost with the alert's line, the charges it posted and its recurring
 * template. Pure.
 */
export interface KpiServicio {
  readonly label: string;
  readonly valor: string;
  readonly nota: string;
  readonly aviso: boolean;
}

const kpi = (label: string, valor: string, nota: string, aviso = false): KpiServicio => ({
  label,
  valor,
  nota,
  aviso,
});

const Mes = (mes: string) => {
  const n = nombreMes(mes);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/** «Julio a septiembre: $480.00 + $900.00 + $1,240.00, entre 3». */
function promedioKpi(s: Servicio, d: DatosServicios): KpiServicio {
  const mes = d.hoy.slice(0, 7);
  const costos = costosDe(s, d);
  const p = promedioMensual(s.cobro, costos, mes);
  if (p === null) return kpi('Promedio al mes', '—', 'Aún no hay gastos registrados');
  if (s.cobro === 'anual')
    return kpi('Promedio al mes', formatMoney(p), 'Lo del último año, entre 12');
  const meses = [...costos]
    .filter(([m, v]) => m < mes && v > 0n)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3)
    .reverse();
  const [primero] = meses;
  const ultimo = meses[meses.length - 1];
  const rango =
    primero === undefined || ultimo === undefined || primero === ultimo
      ? Mes(ultimo?.[0] ?? mes)
      : `${Mes(primero[0])} a ${nombreMes(ultimo[0])}`;
  const suma = meses.map(([, v]) => formatMoney(v)).join(' + ');
  return kpi(
    'Promedio al mes',
    formatMoney(p),
    meses.length === 1 ? `${rango}: ${suma}` : `${rango}: ${suma}, entre ${meses.length}`,
  );
}

function usoKpi(s: Servicio, hoy: string): KpiServicio {
  const mes = hoy.slice(0, 7);
  const l = lecturaDe(s, hoy);
  if (l === null) return kpi(`${Mes(mes)} hasta hoy`, '—', 'Escribe lo que va del mes en Editar');
  const dias = l.dias === 1 ? '1 día' : `${l.dias} días`;
  if (l.proyeccion === null)
    return kpi(`${Mes(mes)} hasta hoy`, formatMoney(l.gasto), `Sin proyección: hay ${dias} de uso`);
  const van = `Van ${formatMoney(l.gasto)} en ${dias}`;
  const pasa = s.aviso !== null && l.proyeccion.monto > s.aviso;
  const nota =
    pasa && s.aviso !== null
      ? `${van}: pasa del aviso por ${formatMoney(l.proyeccion.monto - s.aviso)}`
      : van;
  return kpi(`${Mes(mes)}, proyección`, formatMoney(l.proyeccion.monto), nota, pasa);
}

const cantidad = (n: number | null, unidad: string | null) =>
  `${(n ?? 0).toLocaleString('es-MX')} ${unidad ?? ''}`.trim();

function gratisKpis(s: Servicio): readonly KpiServicio[] {
  const pct = s.limite === null ? 0 : usoDelPlan(s.usoPlan ?? 0, s.limite);
  const de = `${(s.usoPlan ?? 0).toLocaleString('es-MX')} de ${cantidad(s.limite, s.unidad)}`;
  return [
    kpi('Uso del plan', `${pct} %`, de, pct >= CERCA_DEL_LIMITE),
    kpi('Límite del plan', cantidad(s.limite, s.unidad), 'Avisa al pasar de 60 %'),
  ];
}

const montoDe = (s: Servicio) => (s.monto === null ? '—' : montoEn(s.moneda, s.monto));

/** The second and third figures, by how it charges. */
const PROPIOS: Record<
  Servicio['cobro'],
  (s: Servicio, d: DatosServicios) => readonly KpiServicio[]
> = {
  uso: (s, d) => [
    usoKpi(s, d.hoy),
    kpi(
      'Avisa si el mes pasa de',
      s.aviso === null ? '—' : formatMoney(s.aviso),
      'Se cambia en Editar',
    ),
  ],
  fijo: (s, d) => [
    kpi('Próximo cargo', proximoTexto(s, d.hoy), montoDe(s)),
    kpi('Cuánto', montoDe(s), `Cada mes, el día ${s.diaCargo ?? '—'}`),
  ],
  anual: (s, d) => [
    kpi('Renueva', proximoTexto(s, d.hoy), montoDe(s)),
    kpi('Cuánto al año', montoDe(s), 'Avisa 30 días antes en Señales'),
  ],
  gratis: (s) => gratisKpis(s),
  comision: (s, d) => {
    const mes = d.hoy.slice(0, 7);
    return [
      kpi(
        `${Mes(mes)} hasta hoy`,
        formatMoney(d.comisiones.get(mes) ?? 0n),
        'De los depósitos de Stripe',
      ),
      kpi('Cobra', s.tarifa ?? '—', 'Por cada pago'),
    ];
  },
};

export const kpisDe = (s: Servicio, d: DatosServicios): readonly KpiServicio[] => [
  promedioKpi(s, d),
  ...PROPIOS[s.cobro](s, d),
];

export interface GastoRegistrado {
  readonly href: string;
  readonly fecha: string;
  readonly concepto: string;
  readonly monto: string;
}

/** The charges its template posted, newest first, each with the month it paid. */
export function gastosDe(s: Servicio, d: DatosServicios): readonly GastoRegistrado[] {
  if (s.plantillaId === null || s.cobro === 'comision') return [];
  return d.cargos
    .filter((c) => c.plantillaId === s.plantillaId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((c) => ({
      href: `/empresa/movimientos/${c.entryId}`,
      fecha: fechaCorta(c.fecha),
      concepto: `${c.concepto} · ${nombreMes(c.mes)}`,
      monto: formatMoney(c.monto),
    }));
}

/** The chart, for every way of charging but a free plan. */
export function graficaDelServicio(s: Servicio, d: DatosServicios): Grafica | null {
  return s.cobro === 'gratis' ? null : graficaDe(s, costosDe(s, d), d.hoy);
}

/** Under the chart, as board CD-18c words each case. */
export function notaGrafica(s: Servicio, hoy: string): string {
  const l = lecturaDe(s, hoy);
  const mes = nombreMes(hoy.slice(0, 7));
  if (l === null)
    return `Los meses salen de los gastos registrados; ${nombreMes(mesMas(hoy.slice(0, 7), -1))} es el último cerrado.`;
  if (l.proyeccion === null)
    return 'La proyección del mes aparece desde el día 3: con menos días el uso no alcanza para estimar.';
  if (s.aviso !== null && l.proyeccion.monto > s.aviso)
    return `A este ritmo ${mes} pasa del aviso. También aparece en Señales del Resumen.`;
  return `* ${Mes(hoy.slice(0, 7))} en tono claro: lo gastado en ${l.dias} días, llevado al mes completo.`;
}

export const subtituloDe = (s: Servicio, cobro: string) =>
  [categoriaDe(s), cobro, s.pagaCon, s.para]
    .filter((x): x is string => x !== null && x !== '')
    .join(' · ');
