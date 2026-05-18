/** Form types and validation for NuevaRecetaModal. */

import type { useTranslation } from '../../i18n/index';

export interface FormState {
  mpId: string;
  prodId: string;
  cantOrigen: string;
  cantResultante: string;
}

export interface FormErrors {
  mp?: string;
  prod?: string;
  cantOrigen?: string;
  cantResultante?: string;
  mismo?: string;
}

export const INITIAL_STATE: FormState = {
  mpId: '',
  prodId: '',
  cantOrigen: '1',
  cantResultante: '1',
};

type T = ReturnType<typeof useTranslation>['t'];

export function validate(state: FormState, t: T): FormErrors {
  const e: FormErrors = {};
  if (!state.mpId) e.mp = t('conversion.validacion.mpRequired');
  if (!state.prodId) e.prod = t('conversion.validacion.productoRequired');
  if (state.mpId && state.prodId && state.mpId === state.prodId) {
    e.mismo = t('conversion.validacion.mismoProducto');
  }
  const co = Number(state.cantOrigen);
  if (!Number.isInteger(co) || co < 1) e.cantOrigen = t('conversion.validacion.cantidadOrigenMin');
  const cr = Number(state.cantResultante);
  if (!Number.isInteger(cr) || cr < 1)
    e.cantResultante = t('conversion.validacion.cantidadResultanteMin');
  return e;
}
