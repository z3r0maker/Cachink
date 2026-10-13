/**
 * Storybook catalog for the `<SearchBar>` primitive.
 *
 * Real es-MX placeholders so the stories double as a UX reference.
 * Audit Round 2 G2 — closes the Storybook coverage gap for SearchBar.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from '@tamagui/core';
import { SearchBar } from './search-bar';

function SearchBarDemo({ initial = '' }: { initial?: string }): React.ReactElement {
  const [value, setValue] = useState(initial);
  return (
    <View padding={16} width={360}>
      <SearchBar value={value} onChange={setValue} label="Buscar" placeholder="Nombre o teléfono" />
    </View>
  );
}

const meta: Meta<typeof SearchBar> = {
  title: 'Phase 1A / Primitives / Search Bar',
  component: SearchBar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SearchBar>;

/** Default — empty input, leading search icon visible. */
export const Empty: Story = {
  render: () => <SearchBarDemo />,
};

/** Filled — typed query, search icon stays anchored over the left edge. */
export const WithQuery: Story = {
  render: () => <SearchBarDemo initial="María" />,
};

/** Without label — shorter chrome for in-line table search. */
export const NoLabel: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <SearchBar value={value} onChange={setValue} placeholder="Filtrar" ariaLabel="Filtrar" />
      </View>
    );
  },
};
