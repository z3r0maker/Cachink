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
import { Btn, Input, Modal, Scanner } from '../../components/index';
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
      <Input
        label={t('nuevoProducto.nombreLabel')}
        placeholder={t('nuevoProducto.nombrePlaceholder')}
        value={state.nombre}
        onChange={(v) => update({ nombre: v })}
        note={errors.nombre}
        testID="producto-nombre"
      />
      <Input
        label={t('nuevoProducto.skuLabel')}
        placeholder={t('nuevoProducto.skuPlaceholder')}
        value={state.sku}
        onChange={(v) => update({ sku: v })}
        testID="producto-sku"
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

function SecondaryFields({ form, t }: { form: ProductoFormApi; t: T }): ReactElement {
  const { state, errors, update } = form;
  return (
    <>
      <Input
        type="number"
        label={t('nuevoProducto.costoUnitLabel')}
        value={state.costoPesos}
        onChange={(v) => update({ costoPesos: v })}
        note={errors.costo}
        testID="producto-costo"
      />
      <Input
        type="select"
        label={t('nuevoProducto.unidadLabel')}
        value={state.unidad}
        onChange={(v) => update({ unidad: v as InventoryUnit })}
        options={INV_UNIDADES}
        testID="producto-unidad"
      />
      <Input
        type="number"
        label={t('nuevoProducto.umbralLabel')}
        value={state.umbral}
        onChange={(v) => update({ umbral: v })}
        note={errors.umbral}
        testID="producto-umbral"
      />
    </>
  );
}

function ProductoFields({ form, t }: { form: ProductoFormApi; t: T }): ReactElement {
  return (
    <>
      <PrimaryFields form={form} t={t} />
      <SecondaryFields form={form} t={t} />
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
      <Btn variant="ghost" onPress={() => setOpen(true)} fullWidth testID="producto-scan">
        {`📷 ${label}`}
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
      <ProductoFields form={form} t={t} />
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
