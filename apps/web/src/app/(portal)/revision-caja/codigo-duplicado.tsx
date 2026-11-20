import { Button } from '@/components';

import * as s from './form.css';

/** The barcode match in the review (P-45, ADR-150 §4). */
export interface CodigoRepetido {
  /** The catalogue product that has the code. */
  readonly con: string;
  /** Sales the caja captured with the pending product. */
  readonly vendidas: number;
  readonly onSonDistintos: () => void;
}

/**
 * «Tiene el mismo código que …» (board EcRevision): merge into the catalogue
 * product, or say they are different, which takes the code off this one.
 * «Aprobar» waits until one of the two is done.
 */
/** What a merge carries over, in the board's words. */
function seMueven(vendidas: number): string {
  if (vendidas === 0) return 'Si es lo mismo, fusiónalos.';
  const cuales =
    vendidas === 1 ? 'la venta capturada se mueve' : `las ${vendidas} ventas capturadas se mueven`;
  return `Si es lo mismo, fusiónalos: ${cuales} al registro existente.`;
}

export function CodigoDuplicado(p: CodigoRepetido & { readonly onFusionar: () => void }) {
  return (
    <div className={s.duplicado} data-testid="revision-codigo-duplicado">
      <div className={s.duplicadoTexto}>
        Tiene el mismo código que <strong>{p.con}</strong>, de tu catálogo. {seMueven(p.vendidas)}
      </div>
      <div className={s.duplicadoBotones}>
        <Button size="sm" onClick={p.onFusionar}>
          {`Fusionar con ${p.con}`}
        </Button>
        <Button size="sm" variant="secondary" onClick={p.onSonDistintos}>
          Son distintos
        </Button>
      </div>
      <div className={s.duplicadoNota}>
        {`«Son distintos» le quita el código a este producto. ${p.con} se queda con él. Primero fusiona o di que son distintos.`}
      </div>
    </div>
  );
}
