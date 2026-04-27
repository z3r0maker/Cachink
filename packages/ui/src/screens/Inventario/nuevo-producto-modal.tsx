/**
 * NuevoProductoModal — create a new producto in the catalog
 * (Slice 2 C14, M5-T03).
 *
 * Pure UI. Submit bubbles a CrearProductoInput; parent wires
 * `useCrearProducto`.
 */

import { useState, type ReactElement } from 'react';
import type { InventoryCategory, InventoryUnit } from '@cachink/domain';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { Btn, Icon, Input, Modal, Scanner } from '../../components/index';
import { IntegerField, MoneyField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import {
  INV_CATEGORIAS,
  INV_UNIDADES,
  buildProductoPayload,
  useProductoForm,
  validateProducto,
  type ProductoFormApi,
} from './nuevo-producto-form';

export interface NuevoProductoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearProductoInput) => void;
  readonly submitting?: boolean;
}

type T = ReturnType<typeof useTranslation>['t'];

function PrimaryFields({ form, t }: { form: ProductoFormApi; t: T }): ReactElement {
  const { state, errors, update } = form;
  return (
    <>
      <TextField
        label={t('nuevoProducto.nombreLabel')}
        placeholder={t('nuevoProducto.nombrePlaceholder')}
        value={state.nombre}
        onChange={(v) => update({ nombre: v })}
        note={errors.nombre}
        testID="producto-nombre"
        returnKeyType="next"
      />
      <TextField
        label={t('nuevoProducto.skuLabel')}
        placeholder={t('nuevoProducto.skuPlaceholder')}
        value={state.sku}
        onChange={(v) => update({ sku: v })}
        testID="producto-sku"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevoProducto.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => update({ categoria: v as InventoryCategory })}
        options={INV_CATEGORIAS}
        testID="producto-categoria"
      />
    </>
  );
}

interface FieldsBlockProps {
  form: ProductoFormApi;
  t: T;
  onSubmitEditing?: () => void;
}

function SecondaryFields({ form, t, onSubmitEditing }: FieldsBlockProps): ReactElement {
  const { state, errors, update } = form;
  return (
    <>
      <MoneyField
        label={t('nuevoProducto.costoUnitLabel')}
        value={state.costoPesos}
        onChange={(v) => update({ costoPesos: v })}
        note={errors.costo}
        testID="producto-costo"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevoProducto.unidadLabel')}
        value={state.unidad}
        onChange={(v) => update({ unidad: v as InventoryUnit })}
        options={INV_UNIDADES}
        testID="producto-unidad"
      />
      <IntegerField
        label={t('nuevoProducto.umbralLabel')}
        value={state.umbral}
        onChange={(v) => update({ umbral: v })}
        note={errors.umbral}
        min={0}
        testID="producto-umbral"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

/** Audit 5.4 — Bluetooth-keyboard Enter-to-submit threads through {@link FieldsBlockProps}. */
function ProductoFields({ form, t, onSubmitEditing }: FieldsBlockProps): ReactElement {
  return (
    <>
      <PrimaryFields form={form} t={t} />
      <SecondaryFields form={form} t={t} onSubmitEditing={onSubmitEditing} />
    </>
  );
}

function ScanSkuBtn({
  onScanned,
  label,
}: {
  onScanned: (code: string) => void;
  label: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn
        variant="ghost"
        onPress={() => setOpen(true)}
        fullWidth
        icon={<Icon name="camera" size={16} />}
        testID="producto-scan"
      >
        {label}
      </Btn>
      <Scanner
        open={open}
        onClose={() => setOpen(false)}
        onScan={(code) => onScanned(code)}
        mode="single"
      />
    </>
  );
}

export function NuevoProductoModal(props: NuevoProductoModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useProductoForm();

  const handleSubmit = (): void => {
    const v = validateProducto(form.state, t('nuevoProducto.required'));
    if (Object.keys(v).length > 0) {
      form.setErrors(v);
      return;
    }
    form.setErrors({});
    props.onSubmit(buildProductoPayload(form.state));
    form.reset();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevoProducto.title')}
      testID="nuevo-producto-modal"
    >
      <ProductoFields form={form} t={t} onSubmitEditing={handleSubmit} />
      <ScanSkuBtn onScanned={(code) => form.update({ sku: code })} label={t('scanner.title')} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="producto-submit"
      >
        {t('nuevoProducto.save')}
      </Btn>
    </Modal>
  );
}
