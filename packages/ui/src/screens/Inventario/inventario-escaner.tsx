/**
 * Inventario's escáner (M-20, ADR-150; board EcInventario): «Escanear» opens
 * the escáner one product at a time. A product Inventario lists closes it and
 * opens that product's «Llegó mercancía», marked «Del escáner», with only the
 * quantity left. An unknown code offers «Darlo de alta» with Cobrar's
 * questions (Producto nuevo), then the same sheet on the new product once the
 * read lists it. A shared code asks which one, as in Cobrar.
 */
import { useState, type ReactElement } from 'react';
import type { Existencia } from '@xangarro/caja/inventario';
import type { InventoryCategory, Product } from '@xangarro/domain';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import type { ProductoCobrar } from '../Ventas/cobrar-catalogo';
import { EscanerSheet, type EscanerProducto } from '../Ventas/escaner-sheet';
import { ProductoNuevoSheet } from '../Ventas/producto-nuevo-sheet';
import type { HojaVivo } from './use-hoja';

/** What the route hands the screen for the escáner; without it there is no «Escanear». */
export interface InventarioEscanerProps {
  /** Every product of the catalogue, supplies included, as the escáner reads them. */
  readonly productos: readonly ProductoCobrar[];
  /** The types the catalogue already uses (Producto nuevo's third question). */
  readonly tipos: readonly InventoryCategory[];
  readonly onGuardar: (input: CrearProductoInput) => Promise<Product>;
  /** After an alta: Inventario reads again, so the new product is listed. */
  readonly onCreado: () => void;
}

interface InventarioEscanerVivo {
  readonly config: InventarioEscanerProps;
  readonly abierto: boolean;
  readonly onCerrar: () => void;
  readonly existencias: readonly Existencia[];
  readonly dueno: string;
  readonly hoja: Pick<HojaVivo, 'delEscaner' | 'esperar'>;
}

function useFlujo(p: InventarioEscanerVivo) {
  // A code here means Producto nuevo is open on it, in the escáner's place.
  const [codigo, setCodigo] = useState<string | null>(null);
  const listados = new Set(p.existencias.map((e) => e.id));
  const cerrarTodo = (): void => {
    setCodigo(null);
    p.onCerrar();
  };
  const modo: EscanerProducto = {
    tipo: 'producto',
    llevaExistencias: (x) => listados.has(x.id),
    onProducto: (x) => {
      p.onCerrar();
      p.hoja.delEscaner(x.id);
    },
  };
  const alListo = (nuevo: Product): void => {
    cerrarTodo();
    p.config.onCreado();
    p.hoja.esperar(nuevo.id);
  };
  return { codigo, setCodigo, cerrarTodo, modo, alListo };
}

export function InventarioEscaner(p: InventarioEscanerVivo): ReactElement {
  const f = useFlujo(p);
  return (
    <>
      <EscanerSheet
        open={p.abierto && f.codigo === null}
        onClose={p.onCerrar}
        modo={f.modo}
        productos={p.config.productos}
        onAlta={f.setCodigo}
        dueno={p.dueno}
      />
      <ProductoNuevoSheet
        open={p.abierto && f.codigo !== null}
        onClose={f.cerrarTodo}
        codigo={f.codigo}
        tipos={p.config.tipos}
        dueno={p.dueno}
        onGuardar={p.config.onGuardar}
        alGuardar="Darlo de alta y anotar lo que llegó"
        onListo={f.alListo}
      />
    </>
  );
}
