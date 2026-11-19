/**
 * The receipt's camera (M-18, board CgHoja «La cámara»): the product
 * camera's sheet, upright, titled with the gasto it is for. Used by
 * Registrar gasto's draft and by «Agregar foto» on a saved gasto.
 */
import type { ReactElement } from 'react';
import { FotoCamaraSheet, type PistaCamara } from '../foto-producto/foto-camara-sheet';

const PISTA: PistaCamara = {
  titulo: 'Que se lean el total y la fecha',
  cuerpo: 'Ponlo plano y con luz. Se guarda en blanco y negro.',
};

export function ComprobanteCamara(p: {
  readonly abierta: boolean;
  /** «Tortillas · $180.00», or «Gasto» before anything is typed. */
  readonly titulo: string;
  readonly onTomada: (archivo: string) => void;
  readonly onGaleria: () => void;
  readonly onCerrar: () => void;
}): ReactElement | null {
  if (!p.abierta) return null;
  return (
    <FotoCamaraSheet
      nombre={p.titulo}
      eyebrow="Foto del comprobante"
      forma="vertical"
      pista={PISTA}
      onTomada={p.onTomada}
      onGaleria={p.onGaleria}
      onCerrar={p.onCerrar}
    />
  );
}
