/**
 * «Registrar gasto» (M-08, the web drawer as a bottom sheet): what, how much
 * and the category are required; who was paid is optional. Saving goes
 * through the route's write path and the sheet closes; the list's new row on
 * top is the confirmation. Mounted fresh on every opening.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { NuevoGasto } from '@xangarro/caja/gastos';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Categorias, Concepto, Monto, NotaFirma, PieGasto, Proveedor } from './gasto-campos';
import { useGastoForm, useGuardarHoja } from './use-gasto-form';

export interface RegistrarGastoSheetProps {
  readonly open: boolean;
  /** «Ana Robledo, Caja 1», from the session. */
  readonly firma: string;
  readonly onClose: () => void;
  readonly onGuardar: (n: NuevoGasto) => Promise<void>;
}

function Abierto(p: RegistrarGastoSheetProps): ReactElement {
  const f = useGastoForm(null);
  const { guardando, error, guardar } = useGuardarHoja(p.onGuardar, p.onClose);
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Gasto de caja chica"
      title="Registrar gasto"
      closeLabel="Cerrar sin registrar"
      testID="registrar-gasto-sheet"
      footer={
        <PieGasto
          f={f}
          guardando={guardando}
          error={error}
          onCancelar={p.onClose}
          onGuardar={() => void guardar(f.payload())}
        />
      }
    >
      <View gap={18}>
        <Concepto f={f} />
        <Monto f={f} />
        <Categorias f={f} />
        <Proveedor f={f} />
        <NotaFirma firma={p.firma} />
      </View>
    </BottomSheet>
  );
}

export function RegistrarGastoSheet(p: RegistrarGastoSheetProps): ReactElement | null {
  return p.open ? <Abierto {...p} /> : null;
}
