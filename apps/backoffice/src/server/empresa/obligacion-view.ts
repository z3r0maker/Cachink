import type { DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import { formatMonth } from '@xangarro/domain';
import { NOMBRE_EVIDENCIA, siguientesPasos, type Paso } from '@xangarro/domain/corp';

/**
 * An obligation's page (E-04, board CD-05's detail): its title with its
 * period, and the buttons its next steps allow, each blocked with the
 * reason when its proof is missing.
 */
export function tituloDe(o: Pick<ObligacionVista, 'titulo' | 'periodo'>): string {
  if (/^\d{4}-\d{2}$/.test(o.periodo)) return `${o.titulo} de ${formatMonth(o.periodo)}`;
  if (/^\d{4}$/.test(o.periodo)) return `${o.titulo} ${o.periodo}`;
  return o.titulo;
}

const VERBO: Record<Paso, string> = {
  preparada: 'Marcar preparada',
  presentada: 'Marcar presentada',
  pagada: 'Marcar pagada',
};

export interface Accion {
  readonly nuevo: Paso;
  readonly label: string;
  readonly sinPago: boolean;
  /** Why it cannot be pressed yet; null when it can. */
  readonly bloqueada: string | null;
}

export function accionesDe(o: ObligacionVista, docs: readonly DocumentoMeta[]): readonly Accion[] {
  const tiene = new Set(docs.map((d) => d.tipo));
  return siguientesPasos(o.plantilla, o.estado).flatMap((nuevo): Accion[] => {
    const falta = o.plantilla.evidencia[nuevo];
    const label =
      nuevo === 'presentada' && o.plantilla.etiquetaPresentada !== undefined
        ? `Marcar ${o.plantilla.etiquetaPresentada.toLowerCase()}`
        : VERBO[nuevo];
    const bloqueada =
      falta === undefined || tiene.has(falta)
        ? null
        : `Para marcarla ${nuevo === 'presentada' ? (o.plantilla.etiquetaPresentada?.toLowerCase() ?? nuevo) : nuevo}, adjunta ${NOMBRE_EVIDENCIA[falta]}.`;
    const accion = { nuevo, label, sinPago: false, bloqueada };
    if (nuevo !== 'pagada' || bloqueada === null) return [accion];
    return [accion, { nuevo, label: 'No hubo pago', sinPago: true, bloqueada: null }];
  });
}
