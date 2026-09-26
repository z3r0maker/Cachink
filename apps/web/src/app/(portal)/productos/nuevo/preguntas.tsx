'use client';

import type { ProductoTipo, UsoProducto } from '@xangarro/domain';

import { FilterChip, Input, OptionCards, Switch } from '@/components';

import { Swatches } from '../sheet/apariencia';
import { IconoPicker } from '../sheet/icono-picker';
import type { Draft } from '../sheet/use-producto-form';
import * as s from './preguntas.css';
import { ganancia, UNIDADES } from './pasos';

export interface PreguntaProps {
  readonly draft: Draft;
  readonly set: (patch: Partial<Draft>) => void;
}

const USOS = [
  { value: 'venta', title: 'Para vender', description: 'Aparece en la caja.' },
  { value: 'materia-prima', title: 'Materia prima', description: 'Lo usas para preparar.' },
  { value: 'ambos', title: 'Las dos', description: 'Lo vendes y también lo usas.' },
];

const TIPOS = [
  { value: 'producto', title: 'Es un producto', description: 'Algo que se cuenta y se vende.' },
  { value: 'servicio', title: 'Es un servicio', description: 'Se cobra, pero no se acaba.' },
];

/** SKU and servicio: what most owners never need, folded away. */
function MasOpciones({ draft, set }: PreguntaProps) {
  return (
    <details className={s.mas}>
      <summary className={s.masResumen}>Más opciones: código (SKU) o si es un servicio</summary>
      <div className={s.grupo}>
        <Input
          labelText="Código (SKU)"
          hintText="Opcional; el código con el que lo buscas"
          value={draft.sku}
          onChange={(e) => set({ sku: e.target.value })}
          data-testid="producto-sku"
        />
        <OptionCards
          ariaLabel="Tipo"
          options={TIPOS}
          value={draft.tipo}
          onValueChange={(v) => set({ tipo: v as ProductoTipo })}
        />
      </div>
    </details>
  );
}

export function PasoUno({ draft, set }: PreguntaProps) {
  return (
    <div className={s.grupo}>
      <Input
        labelText="¿Cómo se llama?"
        hintText="Así lo verán en la caja."
        placeholder="Por ejemplo: Taco de suadero"
        value={draft.nombre}
        onChange={(e) => set({ nombre: e.target.value })}
        data-testid="producto-nombre"
        autoFocus
      />
      <div className={s.campo}>
        <span className={s.etiqueta}>Su ícono</span>
        <IconoPicker nombre={draft.nombre} icono={draft.icono} onPick={(icono) => set({ icono })} />
      </div>
      <div className={s.campo}>
        <span className={s.etiqueta}>Color de su tarjeta</span>
        <Swatches draft={draft} set={set} />
      </div>
      <div className={s.campo}>
        <span className={s.etiqueta}>¿Para qué lo usas?</span>
        <OptionCards
          ariaLabel="Uso"
          options={USOS}
          value={draft.usoProducto}
          onValueChange={(v) => set({ usoProducto: v as UsoProducto })}
        />
      </div>
      <MasOpciones draft={draft} set={set} />
    </div>
  );
}

function Unidades({ draft, set }: PreguntaProps) {
  return (
    <div className={s.campo}>
      <span className={s.etiqueta}>¿Cómo lo vendes?</span>
      <div className={s.chips} role="group" aria-label="Unidad">
        {UNIDADES.map((u) => (
          <FilterChip
            key={u.value}
            label={u.label}
            selected={draft.unidad === u.value}
            onSelect={() => set({ unidad: u.value })}
          />
        ))}
      </div>
    </div>
  );
}

export function PasoDos({ draft, set }: PreguntaProps) {
  const g = ganancia(draft.costo, draft.precio, draft.unidad);
  return (
    <div className={s.grupo}>
      <div className={s.dos}>
        <Input
          labelText="¿Cuánto te cuesta?"
          hintText="Lo que pagas por uno, en pesos."
          numeric
          value={draft.costo}
          onChange={(e) => set({ costo: e.target.value })}
          data-testid="producto-costo"
          autoFocus
        />
        <Input
          labelText="¿En cuánto lo vendes?"
          hintText="El precio que cobra la caja."
          numeric
          value={draft.precio}
          onChange={(e) => set({ precio: e.target.value })}
          data-testid="producto-precio"
        />
      </div>
      <p className={s.ganancia[g.tono]} data-testid="producto-margen" aria-live="polite">
        {g.texto}
      </p>
      <Unidades draft={draft} set={set} />
    </div>
  );
}

export function PasoTres({ draft, set }: PreguntaProps) {
  if (draft.tipo === 'servicio') {
    return <p className={s.nota}>Los servicios no llevan existencias: ya puedes crearlo.</p>;
  }
  return (
    <div className={s.grupo}>
      <label className={s.interruptor}>
        <Switch
          checked={draft.seguirStock}
          label="Llevar la cuenta de existencias"
          onCheckedChange={(on) => set({ seguirStock: on })}
        />
        <span>
          <strong>Llevar la cuenta de existencias</strong>
          <span className={s.sub}>Apágalo para cosas que no se acaban, como un envío.</span>
        </span>
      </label>
      {draft.seguirStock ? (
        <>
          <Input
            labelText="Avísame cuando queden"
            hintText="Te aparece en Pendientes de hoy antes de que se acabe."
            numeric
            value={draft.umbral}
            onChange={(e) => set({ umbral: e.target.value })}
            data-testid="producto-umbral"
          />
          <p className={s.nota}>
            Empieza en 0. Cuando lo crees, súmale lo que tienes con «Movimiento» en su renglón.
          </p>
        </>
      ) : null}
    </div>
  );
}
