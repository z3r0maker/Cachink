/**
 * InventarioTab — Inventario-purchase form inside NuevoEgresoModal
 * (Slice 2 C5, M4-T02 inventario, ADR-021).
 *
 * Fields: producto (select), cantidad (int > 0), costo_unit (pesos).
 *
 * On submit calls `RegistrarMovimientoInventarioUseCase` via the
 * useRegistrarMovimiento hook (parent wires it). The use-case
 * dual-writes the MovimientoInventario + the Egreso with
 * categoria='Inventario' — this form never touches the Expense
 * side directly per ADR-021.
 *
 * Empty-state: when no productos exist, shows a "Crear producto" Btn.
 * Creating a producto mid-flow auto-selects it.
 */

import { useState, type ReactElement } from 'react';
import {
  NewInventoryMovementSchema,
  fromPesos,
  type BusinessId,
  type IsoDate,
  type NewInventoryMovement,
  type Product,
  type ProductId,
} from '@cachink/domain';
import { Btn, Input } from '../../../components/index';
import { useTranslation } from '../../../i18n/index';

export interface InventarioTabProps {
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly productos: readonly Product[];
  readonly onSubmit: (input: NewInventoryMovement) => void;
  readonly onCrearProducto?: () => void;
  readonly submitting?: boolean;
}

interface FormState {
  productoId: string;
  cantidad: string;
  costoUnitPesos: string;
}

interface FormErrors {
  producto?: string;
  cantidad?: string;
  costo?: string;
}

function initialState(): FormState {
  return { productoId: '', cantidad: '', costoUnitPesos: '' };
}

function validate(state: FormState, requiredLabel: string, cantidadInvalid: string): FormErrors {
  const errors: FormErrors = {};
  if (!state.productoId) errors.producto = requiredLabel;
  const cant = Number(state.cantidad);
  if (!Number.isInteger(cant) || cant <= 0) errors.cantidad = cantidadInvalid;
  const costo = Number(state.costoUnitPesos);
  if (!Number.isFinite(costo) || costo <= 0) errors.costo = requiredLabel;
  return errors;
}

function buildPayload(
  state: FormState,
  businessId: BusinessId,
  fecha: IsoDate,
): NewInventoryMovement {
  return NewInventoryMovementSchema.parse({
    productoId: state.productoId as ProductId,
    fecha,
    tipo: 'entrada',
    cantidad: Number(state.cantidad),
    costoUnitCentavos: fromPesos(state.costoUnitPesos),
    motivo: 'Compra a proveedor',
    businessId,
  });
}

interface InventarioFieldsProps {
  readonly state: FormState;
  readonly update: (p: Partial<FormState>) => void;
  readonly errors: FormErrors;
  readonly productos: readonly Product[];
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function InventarioFields(props: InventarioFieldsProps): ReactElement {
  const { state, update, errors, productos, t } = props;
  return (
    <>
      <Input
        type="select"
        label={t('nuevoEgreso.productoLabel')}
        value={state.productoId}
        onChange={(v) => update({ productoId: v })}
        options={productos.map((p) => p.id)}
        note={errors.producto}
        testID="inventario-producto"
      />
      <Input
        type="number"
        label={t('nuevoEgreso.cantidadLabel')}
        value={state.cantidad}
        onChange={(v) => update({ cantidad: v })}
        note={errors.cantidad}
        testID="inventario-cantidad"
      />
      <Input
        type="number"
        label={t('nuevoEgreso.costoUnitLabel')}
        value={state.costoUnitPesos}
        onChange={(v) => update({ costoUnitPesos: v })}
        note={errors.costo}
        testID="inventario-costo"
      />
    </>
  );
}

function EmptyProductos({
  onCrearProducto,
  t,
}: {
  onCrearProducto: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Btn variant="soft" onPress={onCrearProducto} fullWidth testID="inventario-crear-producto">
      {t('nuevoEgreso.crearProducto')}
    </Btn>
  );
}

export function InventarioTab(props: InventarioTabProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = (p: Partial<FormState>): void => setState((prev) => ({ ...prev, ...p }));
  const handleSubmit = (): void => {
    const v = validate(state, t('empleados.required'), t('nuevoEgreso.cantidadInvalid'));
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    props.onSubmit(buildPayload(state, props.businessId, props.fecha));
    setState(initialState());
  };

  if (props.productos.length === 0 && props.onCrearProducto) {
    return <EmptyProductos onCrearProducto={props.onCrearProducto} t={t} />;
  }

  return (
    <>
      <InventarioFields
        state={state}
        update={update}
        errors={errors}
        productos={props.productos}
        t={t}
      />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="inventario-submit"
      >
        {t('nuevoEgreso.save')}
      </Btn>
    </>
  );
}
