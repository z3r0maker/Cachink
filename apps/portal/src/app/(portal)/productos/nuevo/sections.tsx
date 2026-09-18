'use client';

import {
  InventoryCategoryEnum,
  InventoryUnitEnum,
  type InventoryCategory,
  type InventoryUnit,
  type ProductoTipo,
  type UsoProducto,
} from '@xangarro/domain';

import { FilterChip, Input, OptionCards, Switch, Tag } from '@/components';
import { marginPercent } from '@/lib/money';
import { eyebrow } from '@/styles/text.css';

import { chipRow, section, toggleRow, twoCol } from './nuevo.css';
import type { Draft } from './use-nuevo-producto';

/**
 * The first four sections of «Nuevo producto» (P-07). Choices of five or fewer
 * are option cards (CLAUDE.md §6); longer lists are chips.
 */
export interface SectionProps {
  readonly draft: Draft;
  readonly set: (patch: Partial<Draft>) => void;
}

const TIPOS = [
  { value: 'producto', title: 'Producto', description: 'Algo que se cuenta y se vende.' },
  { value: 'servicio', title: 'Servicio', description: 'Se cobra, pero no tiene existencias.' },
];
const USOS = [
  { value: 'venta', title: 'Para vender', description: 'Aparece en la caja de los teléfonos.' },
  {
    value: 'materia-prima',
    title: 'Materia prima',
    description: 'Se usa para producir, no se vende.',
  },
  { value: 'ambos', title: 'Ambos', description: 'Se vende y también se usa para producir.' },
];

export function Basico({ draft, set }: SectionProps) {
  return (
    <div className={section}>
      <span className={eyebrow}>Básico</span>
      <Input
        labelText="Nombre"
        value={draft.nombre}
        onChange={(e) => set({ nombre: e.target.value })}
        data-testid="nuevo-nombre"
      />
      <Input
        labelText="SKU"
        hintText="Opcional; el código que usas para buscarlo"
        value={draft.sku}
        onChange={(e) => set({ sku: e.target.value })}
        data-testid="nuevo-sku"
      />
      <OptionCards
        ariaLabel="Tipo"
        options={TIPOS}
        value={draft.tipo}
        onValueChange={(v) => set({ tipo: v as ProductoTipo })}
      />
      <div className={chipRow} role="group" aria-label="Categoría">
        {InventoryCategoryEnum.options.map((c) => (
          <FilterChip
            key={c}
            label={c}
            selected={draft.categoria === c}
            onSelect={() => set({ categoria: c as InventoryCategory })}
          />
        ))}
      </div>
    </div>
  );
}

export function Uso({ draft, set }: SectionProps) {
  return (
    <div className={section}>
      <span className={eyebrow}>Uso</span>
      <OptionCards
        ariaLabel="Uso"
        options={USOS}
        value={draft.usoProducto}
        onValueChange={(v) => set({ usoProducto: v as UsoProducto })}
      />
    </div>
  );
}

export function Precio({ draft, set }: SectionProps) {
  const margin = marginPercent(draft.costo, draft.precio);
  return (
    <div className={section}>
      <span className={eyebrow}>Precio</span>
      <div className={twoCol}>
        <Input
          labelText="Costo"
          hintText="En pesos"
          numeric
          value={draft.costo}
          onChange={(e) => set({ costo: e.target.value })}
          data-testid="nuevo-costo"
        />
        <Input
          labelText="Precio de venta"
          hintText="En pesos"
          numeric
          value={draft.precio}
          onChange={(e) => set({ precio: e.target.value })}
          data-testid="nuevo-precio"
        />
      </div>
      {margin === null ? null : (
        <span data-testid="nuevo-margen">
          <Tag tone={margin > 0 ? 'success' : 'danger'}>Margen {margin}%</Tag>
        </span>
      )}
    </div>
  );
}

export function Inventario({ draft, set }: SectionProps) {
  return (
    <div className={section}>
      <span className={eyebrow}>Inventario</span>
      <div className={chipRow} role="group" aria-label="Unidad">
        {InventoryUnitEnum.options.map((u) => (
          <FilterChip
            key={u}
            label={u}
            selected={draft.unidad === u}
            onSelect={() => set({ unidad: u as InventoryUnit })}
          />
        ))}
      </div>
      <label className={toggleRow}>
        <Switch
          checked={draft.seguirStock}
          label="Llevar existencias"
          onCheckedChange={(on) => set({ seguirStock: on })}
        />
        Llevar existencias · empieza en 0; súmalas con un movimiento
      </label>
      {draft.seguirStock ? (
        <Input
          labelText="Aviso de stock bajo"
          hintText="Avisa cuando queden estas unidades o menos"
          numeric
          value={draft.umbral}
          onChange={(e) => set({ umbral: e.target.value })}
        />
      ) : null}
    </div>
  );
}
