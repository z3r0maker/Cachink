import type { Paso, Plantilla, TipoEvidencia } from './obligaciones.js';

/**
 * MEXIA's obligations as a SAS in RESICO (E-04's seed, ADR-124). The
 * contador confirms the list once a year against the RMF; a change is a
 * commit here, reviewed like code. The agreement's own deadlines (funding
 * calls) come from Socios, not from this list.
 */
const DECLARACION = {
  pasos: ['preparada', 'presentada', 'pagada'] as readonly Paso[],
  evidencia: { presentada: 'acuse', pagada: 'comprobante_pago' } as Partial<
    Record<Paso, TipoEvidencia>
  >,
  exenta: null,
};

const TRAMITE = {
  pasos: ['presentada'] as readonly Paso[],
  evidencia: { presentada: 'acuse' } as Partial<Record<Paso, TipoEvidencia>>,
  exenta: null,
};

export const CATALOGO: readonly Plantilla[] = [
  {
    id: 'isr_mensual',
    titulo: 'ISR provisional',
    autoridad: 'SAT',
    fundamento: 'LISR Título VII Cap. XI · pago provisional mensual',
    regla: { tipo: 'mensual', dia: 17 },
    ...DECLARACION,
  },
  {
    id: 'iva_mensual',
    titulo: 'IVA mensual',
    autoridad: 'SAT',
    fundamento: 'LIVA art. 5-D · declaración mensual',
    regla: { tipo: 'mensual', dia: 17 },
    ...DECLARACION,
  },
  {
    id: 'declaracion_anual',
    titulo: 'Declaración anual',
    autoridad: 'SAT',
    fundamento: 'LISR · personas morales, a más tardar el 31 de marzo',
    regla: { tipo: 'anual', mes: 3, dia: 31, ajuste: 'siguiente' },
    ...DECLARACION,
  },
  {
    id: 'informe_sas',
    titulo: 'Informe anual de la SAS',
    autoridad: 'Economía',
    fundamento: 'LGSM art. 272 · durante marzo',
    regla: { tipo: 'anual', mes: 3, dia: 31, ajuste: 'anterior' },
    ...TRAMITE,
  },
  {
    id: 'opinion_32d',
    titulo: 'Opinión de cumplimiento 32-D',
    autoridad: 'SAT',
    fundamento: 'CFF art. 32-D · revisión mensual',
    regla: { tipo: 'fin_de_mes' },
    pasos: ['presentada'],
    evidencia: { presentada: 'opinion_32d' },
    etiquetaPresentada: 'Descargada',
    exenta: null,
  },
  {
    id: 'buzon',
    titulo: 'Revisión del buzón tributario',
    autoridad: 'SAT',
    fundamento: 'CFF art. 17-K · revisión mensual',
    regla: { tipo: 'fin_de_mes' },
    pasos: ['presentada'],
    evidencia: { presentada: 'captura' },
    etiquetaPresentada: 'Revisada',
    exenta: null,
  },
  {
    id: 'beneficiario_controlador',
    titulo: 'Beneficiario controlador',
    autoridad: 'SAT',
    fundamento: 'CFF arts. 32-B Ter a 32-B Quinquies · tras un cambio de acciones',
    regla: { tipo: 'evento', diasHabiles: 15 },
    ...TRAMITE,
  },
  {
    id: 'csd',
    titulo: 'Renovación del CSD',
    autoridad: 'SAT',
    fundamento: 'Sin el certificado de sello digital no se factura',
    regla: { tipo: 'fecha' },
    ...TRAMITE,
  },
  {
    id: 'efirma',
    titulo: 'Renovación de la e.firma',
    autoridad: 'SAT',
    fundamento: 'Sin e.firma vigente no se renueva el CSD ni se firman trámites',
    regla: { tipo: 'fecha' },
    ...TRAMITE,
  },
  {
    id: 'tramite',
    titulo: 'Trámite',
    autoridad: 'IMPI',
    fundamento: 'Un trámite con fecha, como la cesión de la marca',
    regla: { tipo: 'fecha' },
    ...TRAMITE,
  },
  {
    id: 'diot',
    titulo: 'DIOT',
    autoridad: 'SAT',
    fundamento: 'LIVA art. 32 fr. VIII',
    regla: { tipo: 'mensual', dia: 31 },
    pasos: ['presentada'],
    evidencia: { presentada: 'acuse' },
    exenta: {
      motivo: 'RESICO persona moral está relevada · revisar cada año con la RMF',
      revisar: '2027-01',
    },
  },
  {
    id: 'contabilidad_electronica',
    titulo: 'Envío mensual de contabilidad electrónica',
    autoridad: 'SAT',
    fundamento: 'CFF art. 28 fr. IV',
    regla: { tipo: 'mensual', dia: 3 },
    pasos: ['presentada'],
    evidencia: { presentada: 'acuse' },
    exenta: {
      motivo:
        'RESICO persona moral no la envía, pero sí la lleva 5 años · revisar cada año con la RMF',
      revisar: '2027-01',
    },
  },
];

export function plantilla(id: string): Plantilla | undefined {
  return CATALOGO.find((p) => p.id === id);
}
