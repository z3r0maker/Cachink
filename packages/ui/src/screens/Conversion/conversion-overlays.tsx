/** ConversionOverlays — NuevaRecetaModal + ConvertirSheet modals. */

import type { ReactElement } from 'react';
import type { ConversionReceta, Product } from '@cachink/domain';
import type { useCrearConversionReceta, useEjecutarConversion } from '../../hooks/index';
import { NuevaRecetaModal } from './nueva-receta-modal';
import { ConvertirSheet } from './convertir-sheet';

export interface ConversionOverlaysProps {
  readonly mps: readonly Product[];
  readonly ventas: readonly Product[];
  readonly productMap: ReadonlyMap<string, Product>;
  readonly stockMap: ReadonlyMap<string, number>;
  readonly crearReceta: ReturnType<typeof useCrearConversionReceta>;
  readonly ejecutar: ReturnType<typeof useEjecutarConversion>;
  readonly recetaModalOpen: boolean;
  readonly setRecetaModalOpen: (v: boolean) => void;
  readonly convertir: ConversionReceta | null;
  readonly setConvertir: (v: ConversionReceta | null) => void;
}

function RecetaModalWrapper(p: ConversionOverlaysProps): ReactElement {
  return (
    <NuevaRecetaModal
      open={p.recetaModalOpen}
      onClose={() => p.setRecetaModalOpen(false)}
      onSubmit={(input) =>
        p.crearReceta.mutate(input, { onSuccess: () => p.setRecetaModalOpen(false) })
      }
      submitting={p.crearReceta.isPending}
      materiasPrimas={p.mps}
      productosVenta={p.ventas}
    />
  );
}

function ConvertirWrapper(p: ConversionOverlaysProps): ReactElement {
  return (
    <ConvertirSheet
      open={p.convertir !== null}
      onClose={() => p.setConvertir(null)}
      receta={p.convertir}
      products={p.productMap}
      stockMap={p.stockMap}
      onConfirm={(mult) => {
        if (!p.convertir) return;
        p.ejecutar.mutate(
          { recetaId: p.convertir.id, multiplicador: mult },
          { onSuccess: () => p.setConvertir(null) },
        );
      }}
      submitting={p.ejecutar.isPending}
    />
  );
}

export function ConversionOverlays(p: ConversionOverlaysProps): ReactElement {
  return (
    <>
      <RecetaModalWrapper {...p} />
      <ConvertirWrapper {...p} />
    </>
  );
}
