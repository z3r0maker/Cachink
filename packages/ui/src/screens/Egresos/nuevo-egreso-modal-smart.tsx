/**
 * NuevoEgresoModalSmart — smart wrapper around the render-prop
 * NuevoEgresoModal that owns the three tabs + all mutation hooks.
 *
 * Before this component existed, each route adapter had to manually
 * wire `renderGastoTab` / `renderNominaTab` / `renderInventarioTab`.
 * The Round 2 audit found both mobile + desktop routes were mounting
 * `<NuevoEgresoModal open onClose>` with no render props — meaning
 * every tab rendered a `<PlaceholderBody>` debug stub. This smart
 * wrapper closes the gap permanently so new routes can't repeat it
 * (CLAUDE.md §2.3: code lives in exactly one place).
 *
 * Contract: mobile + desktop routes just drop `<NuevoEgresoModalSmart
 * open onClose fecha />` in place of the old dumb modal. All three
 * tabs become fully functional — gasto fires `useRegistrarEgreso`
 * (and `useCrearGastoRecurrente` when the recurrente toggle is on),
 * nómina fires `useCrearEmpleado` + `useRegistrarEgreso`, and
 * inventario-purchase fires `useRegistrarMovimiento` (which
 * dual-writes the Egreso per ADR-021).
 *
 * Mutation plumbing lives in `./nuevo-egreso-smart-hooks.ts` so this
 * file stays under the 200-line file budget (CLAUDE.md §4.4).
 */

import type { ReactElement, ReactNode } from 'react';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { NuevoEgresoModal, type EgresoTab } from './nuevo-egreso-modal';
import { GastoTab } from './tabs/gasto-tab';
import { NominaTab } from './tabs/nomina-tab';
import { InventarioTab } from './tabs/inventario-tab';
import { useCurrentBusinessId } from '../../app-config/index';
import { useEmpleadosForBusiness } from '../../hooks/use-empleados-for-business';
import { useProductos } from '../../hooks/use-productos';
import { useGastoSubmit, useInventarioSubmit, useNominaSubmit } from './nuevo-egreso-smart-hooks';

export interface NuevoEgresoModalSmartProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly fecha: IsoDate;
  readonly initialTab?: EgresoTab;
  /**
   * Opens the "Nuevo Producto" modal at the InventarioTab's empty
   * state. When omitted, the empty state Btn is omitted and the tab
   * falls through to the form (existing behaviour).
   */
  readonly onCrearProducto?: () => void;
  readonly testID?: string;
}

interface TabRenderArgs {
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly onClose: () => void;
  readonly onCrearProducto?: () => void;
}

interface TabRenderers {
  readonly renderGastoTab: () => ReactNode;
  readonly renderNominaTab: () => ReactNode;
  readonly renderInventarioTab: () => ReactNode;
}

function useTabRenderers(args: TabRenderArgs): TabRenderers {
  const gasto = useGastoSubmit(args.onClose);
  const nomina = useNominaSubmit(args.onClose);
  const inventario = useInventarioSubmit(args.onClose);
  const empleadosQ = useEmpleadosForBusiness();
  const productosQ = useProductos();

  return {
    renderGastoTab: () => (
      <GastoTab
        businessId={args.businessId}
        fecha={args.fecha}
        onSubmit={gasto.handle}
        submitting={gasto.submitting}
      />
    ),
    renderNominaTab: () => (
      <NominaTab
        businessId={args.businessId}
        fecha={args.fecha}
        empleados={empleadosQ.data ?? []}
        onSubmit={nomina.handle}
        onCrearEmpleado={nomina.crearEmpleado}
        submitting={nomina.submitting}
      />
    ),
    renderInventarioTab: () => (
      <InventarioTab
        businessId={args.businessId}
        fecha={args.fecha}
        productos={productosQ.data ?? []}
        onSubmit={inventario.handle}
        onCrearProducto={args.onCrearProducto}
        submitting={inventario.submitting}
      />
    ),
  };
}

export function NuevoEgresoModalSmart(props: NuevoEgresoModalSmartProps): ReactElement | null {
  const businessId = useCurrentBusinessId();
  // Hooks run unconditionally — useTabRenderers calls the three query
  // hooks inside, which need to be invoked on every render even when
  // businessId is null so React's hooks rules are satisfied.
  const renderers = useTabRenderers({
    businessId: (businessId ?? '') as BusinessId,
    fecha: props.fecha,
    onClose: props.onClose,
    onCrearProducto: props.onCrearProducto,
  });

  if (!businessId) {
    // No business yet — render the dumb modal with placeholder tabs so
    // the user sees the scaffolding instead of a broken form.
    return (
      <NuevoEgresoModal
        open={props.open}
        onClose={props.onClose}
        initialTab={props.initialTab}
        testID={props.testID}
      />
    );
  }

  return (
    <NuevoEgresoModal
      open={props.open}
      onClose={props.onClose}
      initialTab={props.initialTab}
      renderGastoTab={renderers.renderGastoTab}
      renderNominaTab={renderers.renderNominaTab}
      renderInventarioTab={renderers.renderInventarioTab}
      testID={props.testID}
    />
  );
}
