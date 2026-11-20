import { pesosToCentavos, toPesosString } from '@xangarro/domain';
import type { Declaracion } from '@xangarro/domain/corp';

import type { MesImpuestos } from './impuestos-view';

/**
 * The drawer's fields as text (board CD-09b): the contador's figures when
 * already captured, blank otherwise, and the estimate each is compared
 * against, in centavos as strings, so they cross to the client as they are.
 */
export interface ValoresDeclaracion {
  readonly periodo: string;
  readonly campos: readonly {
    readonly name: 'isr' | 'iva' | 'retencionIsr' | 'retencionIva';
    readonly label: string;
    readonly valor: string;
    readonly estimado: string;
  }[];
  readonly lineaImporte: string;
  readonly lineaVigencia: string;
}

export function valoresDeclaracion(m: MesImpuestos): ValoresDeclaracion {
  const d = m.declaracion;
  const e = m.estimado;
  const campo = (
    name: ValoresDeclaracion['campos'][number]['name'],
    label: string,
    estimado: bigint,
  ) => ({
    name,
    label,
    valor: d === null ? '' : toPesosString(d[name]),
    estimado: String(estimado),
  });
  return {
    periodo: m.mes,
    campos: [
      campo('isr', 'ISR provisional a pagar', e.isr.aPagar),
      campo('iva', 'IVA a pagar', e.iva.aPagar),
      campo('retencionIsr', 'ISR retenido', e.retenciones.isr),
      campo('retencionIva', 'IVA retenido', e.retenciones.iva),
    ],
    lineaImporte: d?.lineaImporte == null ? '' : toPesosString(d.lineaImporte),
    lineaVigencia: d?.lineaVigencia ?? '',
  };
}

/**
 * «Lo que declaró el contador» (E-13, board CD-09b) → a `Declaracion`. The
 * four figures are required (a tax declared at zero is typed as 0); the
 * línea de captura's amount and expiry are optional until the founders have
 * it. Pure: the domain validates what this cannot (`assertDeclaracion`).
 */
export type CapturaDeclaracion =
  { readonly ok: true; readonly v: Declaracion } | { readonly ok: false; readonly message: string };

const texto = (f: FormData, k: string): string => {
  const v = f.get(k);
  return typeof v === 'string' ? v.trim() : '';
};

class Campo extends Error {}

function pesos(f: FormData, k: string, que: string): bigint | null {
  const v = texto(f, k);
  if (v === '') return null;
  const c = pesosToCentavos(v);
  if (c === null) throw new Campo(`Escribe ${que} en pesos, como 1250.50.`);
  return c;
}

function requerido(f: FormData, k: string, que: string): bigint {
  const c = pesos(f, k, que);
  if (c === null) throw new Campo(`Escribe ${que}; si no hay, pon 0.`);
  return c;
}

export function declaracionDelForm(f: FormData): CapturaDeclaracion {
  try {
    const vigencia = texto(f, 'lineaVigencia');
    return {
      ok: true,
      v: {
        periodo: texto(f, 'periodo'),
        isr: requerido(f, 'isr', 'el ISR a pagar'),
        iva: requerido(f, 'iva', 'el IVA a pagar'),
        retencionIsr: requerido(f, 'retencionIsr', 'el ISR retenido'),
        retencionIva: requerido(f, 'retencionIva', 'el IVA retenido'),
        lineaImporte: pesos(f, 'lineaImporte', 'el importe de la línea'),
        lineaVigencia: vigencia === '' ? null : vigencia,
      },
    };
  } catch (error) {
    if (error instanceof Campo) return { ok: false, message: error.message };
    throw error;
  }
}
