/**
 * What «Agregar foto» shows over the Gastos list (M-18, board CgDespues):
 * the receipt camera while it is open, and the toast after a save
 * («Foto guardada. Se les manda a los patrones.») or a refusal.
 */
import type { ReactElement } from 'react';
import { Toast } from '../components/Toast/index';
import { ComprobanteCamara } from './comprobante-camara';
import type { AgregarFoto } from './use-agregar-foto';

export function FotosGasto({ f }: { readonly f: AgregarFoto }): ReactElement {
  return (
    <>
      <ComprobanteCamara
        abierta={f.abierta !== null}
        titulo={f.abierta?.titulo ?? 'Gasto'}
        onTomada={f.tomada}
        onGaleria={f.galeria}
        onCerrar={f.cerrar}
      />
      {f.aviso === null ? null : (
        <Toast
          title={f.aviso.titulo}
          body={f.aviso.cuerpo}
          tone={f.aviso.ok ? 'ok' : 'warn'}
          floating
          onClose={f.cerrarAviso}
          testID="gasto-foto-toast"
        />
      )}
    </>
  );
}
