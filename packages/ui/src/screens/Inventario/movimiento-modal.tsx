/**
 * MovimientoModal — entrada / salida modal for a specific producto
 * (Slice 2 C15, M5-T04).
 *
 * tipo is a segmented toggle. Entrada reveals the costo_unit field
 * and sets motivo options from MOV_MOTIVO_ENT. Salida hides costo and
 * switches to MOV_MOTIVO_SAL. Submit bubbles a NewInventoryMovement;
 * parent wires useRegistrarMovimiento. Per ADR-021 the use-case
 * dual-writes an Egreso on entrada.
 */

import { useState, type ReactElement } from 'react';
import type {
  BusinessId,
  IsoDate,
  MovementType,
  NewInventoryMovement,
  Product,
} from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  buildMovimientoPayload,
  useMovimientoFormState,
  validateCantidad,
} from './movimiento-form';
import { MovimientoFields, TipoToggle } from './movimiento-fields';

export interface MovimientoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: NewInventoryMovement) => void;
  readonly producto: Product;
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly initialTipo?: MovementType;
  readonly submitting?: boolean;
}

export function MovimientoModal(props: MovimientoModalProps): ReactElement {
  const { t } = useTranslation();
  const [state, update, reset] = useMovimientoFormState(props.producto, props.initialTipo);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (): void => {
    if (!validateCantidad(state.cantidad)) {
      setError(t('movimiento.cantidadInvalid'));
      return;
    }
    setError(undefined);
    props.onSubmit(buildMovimientoPayload(state, props.producto, props.businessId, props.fecha));
    reset();
  };

  const title =
    state.tipo === 'entrada' ? t('movimiento.titleEntrada') : t('movimiento.titleSalida');
  return (
    <Modal open={props.open} onClose={props.onClose} title={title} testID="movimiento-modal">
      <TipoToggle value={state.tipo} onChange={(tipo) => update({ tipo })} t={t} />
      <MovimientoFields state={state} update={update} t={t} error={error} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="movimiento-submit"
      >
        {t('movimiento.save')}
      </Btn>
    </Modal>
  );
}
