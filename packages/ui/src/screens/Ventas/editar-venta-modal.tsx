/**
 * EditarVentaModal — partial-edit form behind the Ventas swipe-to-edit
 * gesture (Audit Round 2 J1, Phase K wiring).
 *
 * Pre-populates the brand text + money + select primitives from the
 * supplied `editing` Sale, then submits the diff via `useEditarVenta`.
 * Pure UI — the route owns the open / close state, the same shape as
 * NuevaVentaModal.
 *
 * Stays under the §4.4 file budget by reusing the existing field
 * primitives and form validators rather than re-rolling them.
 */

import { useEffect, useState, type ReactElement } from 'react';
import {
  fromPesos,
  toPesosString,
  type Sale,
  type SaleCategory,
  type PaymentMethod,
} from '@cachink/domain';
import type { SalePatch } from '@cachink/data';
import { Btn, Modal } from '../../components/index';
import { Input } from '../../components/Input/index';
import { MoneyField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
const CATEGORIAS: readonly SaleCategory[] = [
  'Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro',
];
const METODOS: readonly PaymentMethod[] = [
  'Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito',
];
import { useEditarVenta } from '../../hooks/use-editar-venta';

export interface EditarVentaModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editing: Sale | null;
  readonly testID?: string;
}

interface FormState {
  concepto: string;
  categoria: SaleCategory;
  montoPesos: string;
  metodo: PaymentMethod;
}

function fromSale(sale: Sale | null): FormState {
  if (!sale) {
    return { concepto: '', categoria: 'Producto', montoPesos: '', metodo: 'Efectivo' };
  }
  return {
    concepto: sale.concepto,
    categoria: sale.categoria,
    montoPesos: toPesosString(sale.monto),
    metodo: sale.metodo,
  };
}

type Patch = (next: Partial<FormState>) => void;
type T = ReturnType<typeof useTranslation>['t'];

interface FieldsProps {
  readonly state: FormState;
  readonly patch: Patch;
  readonly t: T;
}

function CoreFields({ state, patch, t }: FieldsProps): ReactElement {
  return (
    <>
      <TextField
        label={t('nuevaVenta.conceptoLabel')}
        value={state.concepto}
        onChange={(v) => patch({ concepto: v })}
        testID="editar-venta-concepto"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevaVenta.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => patch({ categoria: v as SaleCategory })}
        options={CATEGORIAS}
        testID="editar-venta-categoria"
      />
      <MoneyField
        label={t('nuevaVenta.montoLabel')}
        value={state.montoPesos}
        onChange={(v) => patch({ montoPesos: v })}
        testID="editar-venta-monto"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevaVenta.metodoLabel')}
        value={state.metodo}
        onChange={(v) => patch({ metodo: v as PaymentMethod })}
        options={METODOS}
        testID="editar-venta-metodo"
      />
    </>
  );
}

function buildPatch(state: FormState): SalePatch {
  return {
    concepto: state.concepto.trim(),
    categoria: state.categoria,
    monto: fromPesos(state.montoPesos),
    metodo: state.metodo,
  };
}

export function EditarVentaModal(props: EditarVentaModalProps): ReactElement {
  const { t } = useTranslation();
  const editar = useEditarVenta();
  const [state, setState] = useState<FormState>(fromSale(props.editing));
  useEffect(() => {
    setState(fromSale(props.editing));
  }, [props.editing]);
  const patch = (next: Partial<FormState>): void => setState((prev) => ({ ...prev, ...next }));
  const handleSubmit = (): void => {
    if (!props.editing) return;
    editar.mutate(
      { id: props.editing.id, patch: buildPatch(state) },
      { onSuccess: () => props.onClose() },
    );
  };
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('editarVenta.title')}
      testID={props.testID ?? 'editar-venta-modal'}
    >
      <CoreFields state={state} patch={patch} t={t} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={editar.isPending}
        fullWidth
        testID="editar-venta-submit"
      >
        {t('editarVenta.save')}
      </Btn>
    </Modal>
  );
}
