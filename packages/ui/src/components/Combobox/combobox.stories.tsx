import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Combobox, type ComboboxOption } from './combobox';

type Regimen = 'RIF' | 'RESICO' | 'Asalariados' | 'Otro';

const REGIMEN_OPTIONS: readonly ComboboxOption<Regimen>[] = [
  { key: 'RIF', label: 'RIF — Régimen de Incorporación Fiscal' },
  { key: 'RESICO', label: 'RESICO — Simplificado de Confianza' },
  { key: 'Asalariados', label: 'Asalariados' },
  { key: 'Otro', label: 'Otro' },
];

type Categoria = string;

const MANY_OPTIONS: readonly ComboboxOption<Categoria>[] = [
  'Materia Prima',
  'Inventario',
  'Nómina',
  'Renta',
  'Servicios',
  'Publicidad',
  'Mantenimiento',
  'Impuestos',
  'Logística',
  'Comisiones',
  'Capacitación',
  'Tecnología',
  'Otro',
].map((label) => ({ key: label, label }));

const meta: Meta<typeof Combobox> = {
  title: 'Phase 1A / Primitives / Combobox',
  component: Combobox,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Regimen | ''>('RIF');
    return (
      <View padding={20} width={360}>
        <Combobox<Regimen>
          label="Régimen fiscal"
          value={value}
          options={REGIMEN_OPTIONS}
          onChange={setValue}
          placeholder="Seleccionar..."
        />
      </View>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState<Regimen | ''>('');
    return (
      <View padding={20} width={360}>
        <Combobox<Regimen>
          label="Régimen fiscal"
          value={value}
          options={REGIMEN_OPTIONS}
          onChange={setValue}
          placeholder="Seleccionar..."
        />
      </View>
    );
  },
};

export const ManyOptions: Story = {
  render: () => {
    const [value, setValue] = useState<Categoria | ''>('');
    return (
      <View padding={20} width={360}>
        <Combobox<Categoria>
          label="Categoría"
          value={value}
          options={MANY_OPTIONS}
          onChange={setValue}
          placeholder="Selecciona una categoría"
        />
      </View>
    );
  },
};

export const Searchable: Story = {
  render: () => {
    const [value, setValue] = useState<Categoria | ''>('');
    return (
      <View padding={20} width={360}>
        <Combobox<Categoria>
          label="Categoría"
          value={value}
          options={MANY_OPTIONS}
          onChange={setValue}
          placeholder="Buscar categoría..."
          searchable
          note="Empieza a escribir para filtrar."
        />
      </View>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <View padding={20} width={360}>
      <Combobox<Regimen>
        label="Régimen fiscal"
        value="RIF"
        options={REGIMEN_OPTIONS}
        onChange={() => null}
        disabled
      />
    </View>
  ),
};
