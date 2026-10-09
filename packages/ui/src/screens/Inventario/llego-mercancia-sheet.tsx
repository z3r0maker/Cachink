/**
 * «Entrada de mercancía» (M-09, the board's dialog as a bottom sheet):
 * pick the product, say how much arrived, and — if you want — who brought
 * it. Saving goes through the route's write path (`useInventario().registrar`)
 * and the sheet closes; the toast on the screen is the confirmation.
 * Mounted fresh on every opening.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Existencia, NuevoMovimientoVivo } from '@xangarro/caja/inventario';
import { BottomSheet } from '../../components/BottomSheet/index';
import { CantidadCampo, ProductoCampo, ProveedorCampo } from './mover-campos';
import { NotaFirma, PieMover } from './mover-pie';
import { useGuardarHoja, useMoverForm } from './use-mover-form';

export interface LlegoMercanciaSheetProps {
  readonly open: boolean;
  /** The catalogue the picker offers; the row's quick square preselects one. */
  readonly items: readonly Existencia[];
  readonly preselect?: string | null;
  /** «Ana Robledo, Caja 1», from the session. */
  readonly firma: string;
  readonly onClose: () => void;
  readonly onGuardar: (m: NuevoMovimientoVivo) => Promise<void>;
}

function Abierto(p: LlegoMercanciaSheetProps): ReactElement {
  const f = useMoverForm('Entrada', p.items, p.preselect ?? null);
  const { guardando, error, guardar } = useGuardarHoja(p.onGuardar, p.onClose);
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Movimiento de inventario"
      title="Entrada de mercancía"
      closeLabel="Cerrar sin registrar"
      testID="llego-mercancia-sheet"
      footer={
        <PieMover
          cta="Registrar entrada"
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
        <ProveedorCampo {...f} />
        <NotaFirma firma={p.firma} />
      </View>
    </BottomSheet>
  );
}

export function LlegoMercanciaSheet(p: LlegoMercanciaSheetProps): ReactElement | null {
  return p.open ? <Abierto {...p} /> : null;
}
