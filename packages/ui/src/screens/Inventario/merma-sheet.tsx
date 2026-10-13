/**
 * «Registrar merma» (M-09, the board's dialog as a bottom sheet): pick the
 * product, say how much spoiled, and always what happened — one of the
 * register's four reasons. Saving goes through the route's write path and
 * the sheet closes; the toast on the screen is the confirmation. Mounted
 * fresh on every opening.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Existencia, NuevoMovimientoVivo } from '@xangarro/caja/inventario';
import { BottomSheet } from '../../components/BottomSheet/index';
import { CantidadCampo, MotivoCampo, ProductoCampo } from './mover-campos';
import { NotaFirma, PieMover } from './mover-pie';
import { useGuardarHoja, useMoverForm } from './use-mover-form';

export interface MermaSheetProps {
  readonly open: boolean;
  /** The catalogue the picker offers; the row's quick square preselects one. */
  readonly items: readonly Existencia[];
  readonly preselect?: string | null;
  /** «Ana Robledo, Caja 1», from the session. */
  readonly firma: string;
  readonly onClose: () => void;
  readonly onGuardar: (m: NuevoMovimientoVivo) => Promise<void>;
}

function Abierto(p: MermaSheetProps): ReactElement {
  const f = useMoverForm('Merma', p.items, p.preselect ?? null);
  const { guardando, error, guardar } = useGuardarHoja(p.onGuardar, p.onClose);
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Movimiento de inventario"
      title="Registrar merma"
      closeLabel="Cerrar sin registrar"
      testID="merma-sheet"
      footer={
        <PieMover
          cta="Registrar merma"
          listo={f.listo}
          guardando={guardando}
          error={error}
          onCancelar={p.onClose}
          onGuardar={() => void guardar(f.payload())}
        />
      }
    >
      <View gap={18}>
        <ProductoCampo {...f} />
        <CantidadCampo {...f} />
        <MotivoCampo {...f} />
        <NotaFirma firma={p.firma} />
      </View>
    </BottomSheet>
  );
}

export function MermaSheet(p: MermaSheetProps): ReactElement | null {
  return p.open ? <Abierto {...p} /> : null;
}
