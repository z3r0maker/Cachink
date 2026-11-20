import { avisoEnviado } from '@xangarro/application/corp';
import {
  estadoDelPlan,
  nombreTrimestre,
  otroSocio,
  resumenDelTrimestre,
  trimestreDe,
  trimestreSiguiente,
  type Columna,
  type ResumenTrimestre,
  type Socio,
} from '@xangarro/domain/corp';
import { formatMoneyEntero } from '@xangarro/domain';

import { bannerDe, type BannerVista } from './tablero-banner';
import type { LecturaTablero } from './tablero-lectura';
import {
  arrastreDe,
  filasDelPlan,
  objetivosDe,
  sociosDe,
  type Arrastre,
  type FilaPlan,
  type ObjetivoVista,
  type SocioVista,
} from './tablero-partes';
import {
  pasaElFiltro,
  vistaDeObligacion,
  vistaDeTarjeta,
  type TarjetaVista,
} from './tablero-tarjeta-vista';
import { hrefTablero, periodoDe, type ParamsTablero } from './tablero-view';

/**
 * The Tablero screen as one model (E-20, board CD-13b): the banners, each
 * partner's tile, the objectives, what rolled over, the plan's table while
 * it is built, and the kanban.
 */
export interface ColumnaVista {
  readonly columna: Columna;
  readonly titulo: string;
  readonly pista: string;
  readonly tarjetas: readonly TarjetaVista[];
}

const COLUMNAS: readonly Omit<ColumnaVista, 'tarjetas'>[] = [
  { columna: 'por_hacer', titulo: 'Por hacer', pista: 'Comprometido en el plan' },
  { columna: 'en_curso', titulo: 'En curso', pista: 'Alguien ya está trabajando en esto' },
  {
    columna: 'en_revision',
    titulo: 'En revisión',
    pista: 'Terminado: el otro socio tiene 10 días para objetar; si no, queda aceptado',
  },
  { columna: 'terminado', titulo: 'Terminado', pista: 'Aceptado o hecho' },
];

export interface VistaTablero {
  readonly resumen: ResumenTrimestre;
  readonly periodo: string;
  readonly banners: readonly BannerVista[];
  readonly socios: readonly SocioVista[];
  readonly desbalance: string | null;
  readonly objetivos: readonly ObjetivoVista[];
  readonly arrastre: Arrastre | null;
  /** The plan's table, while it is built. */
  readonly plan: readonly FilaPlan[] | null;
  /** The kanban, once the quarter started. */
  readonly columnas: readonly ColumnaVista[] | null;
  /** «Enviar el plan» is offered. */
  readonly puedeEnviar: boolean;
  readonly puedeAgregar: boolean;
}

/** The next quarter's plan, sent by the other partner, shown from this one. */
function delSiguiente(l: LecturaTablero, trimestre: string, yo: Socio, n: (s: Socio) => string) {
  const siguiente = trimestreSiguiente(trimestre);
  const plan = estadoDelPlan(l.datos.planes, siguiente);
  if (trimestre !== trimestreDe(l.hoy) || plan.fase !== 'enviado' || plan.por === yo) return [];
  return [
    {
      titulo: `${n(plan.por)} envió el plan del ${nombreTrimestre(siguiente)} para que lo apruebes`,
      texto: 'Revísalo antes de que empiece el trimestre: al aprobarlo, sus valores se congelan.',
      tono: 'warn' as const,
      accion: { texto: 'Revisar el plan', href: hrefTablero(siguiente, { panel: 'plan' }) },
    },
  ];
}

function desbalanceDe(r: ResumenTrimestre, n: (s: Socio) => string): string | null {
  if (r.desbalance === null) return null;
  const s = r.socios.find((x) => x.socio === r.desbalance);
  const o = r.socios.find((x) => x.socio === otroSocio(r.desbalance ?? 1));
  if (s === undefined || o === undefined) return null;
  return `El compromiso de ${n(s.socio)} (${formatMoneyEntero(s.comprometido)}) es menor a la mitad del de ${n(o.socio)} (${formatMoneyEntero(o.comprometido)}). Se avisa mientras se arma el plan; no impide aprobarlo.`;
}

function columnasDe(
  l: LecturaTablero,
  r: ResumenTrimestre,
  p: ParamsTablero,
  n: (s: Socio) => string,
) {
  const tarjetas = r.tarjetas
    .filter((t) => !r.decidido || t.estado.cuentaEn === r.trimestre)
    .map((t) => vistaDeTarjeta(t, r.trimestre, l.datos.objetivos, n));
  const todas = [...tarjetas, ...l.obligaciones.map(vistaDeObligacion)].filter((t) =>
    pasaElFiltro(t, p.ver),
  );
  return COLUMNAS.map((c) => ({ ...c, tarjetas: todas.filter((t) => t.columna === c.columna) }));
}

export function vistaDelTablero(l: LecturaTablero, p: ParamsTablero, yo: Socio): VistaTablero {
  const n = (s: Socio) => l.nombres[s];
  const r = resumenDelTrimestre({
    trimestre: p.trimestre,
    tarjetas: l.datos.tarjetas,
    planes: l.datos.planes,
    hoy: l.hoy,
  });
  const actual = trimestreDe(l.hoy);
  const planeando = r.plan.fase !== 'aprobado' && l.hoy <= r.limitePlan;
  return {
    resumen: r,
    periodo: periodoDe(p.trimestre),
    banners: [
      bannerDe(r, yo, n, l.hoy, avisoEnviado(l.datos, p.trimestre)),
      ...delSiguiente(l, p.trimestre, yo, n),
    ],
    socios: sociosDe(r, n, planeando),
    desbalance: planeando ? desbalanceDe(r, n) : null,
    objetivos: objetivosDe(l.datos.objetivos, r, l.hoy, n),
    arrastre: r.decidido ? arrastreDe(r) : null,
    plan: planeando ? filasDelPlan(r, yo, n) : null,
    columnas: p.trimestre <= actual ? columnasDe(l, r, p, n) : null,
    puedeEnviar: planeando && r.plan.fase === 'borrador' && r.tarjetas.length > 0,
    puedeAgregar: p.trimestre === actual || p.trimestre === trimestreSiguiente(actual),
  };
}
