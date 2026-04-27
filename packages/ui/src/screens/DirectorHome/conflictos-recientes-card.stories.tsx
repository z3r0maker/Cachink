/**
 * Storybook catalog for `<ConflictosRecientesCard>` (Slice 8 M3-C14).
 *
 * The card consumes `useLastConflicts` which reads SQLite via
 * `useDatabase()`. To render in Storybook without a real provider
 * tree, each story stubs the database with a fake `db.all` that
 * returns the desired conflict rows.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from '@tamagui/core';
import type { CachinkDatabase } from '@cachink/data';
import { initI18n } from '../../i18n/index';
import { DatabaseContext } from '../../database/_internal';
import { ConflictosRecientesCard } from './conflictos-recientes-card';

initI18n();

interface FakeRow {
  id: number;
  detected_at: string;
  direction: 'inbound' | 'outbound';
  table_name: string;
  row_id: string;
  loser_updated_at: string;
  loser_device_id: string;
  winner_updated_at: string;
  winner_device_id: string;
  reason: string;
}

function makeRow(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: 1,
    detected_at: '2026-04-25T00:00:00.000Z',
    direction: 'inbound',
    table_name: 'sales',
    row_id: '01HX0000000000000000000001',
    loser_updated_at: '2026-04-25T00:00:00.000Z',
    loser_device_id: 'DEV-XYZABC123',
    winner_updated_at: '2026-04-25T00:00:01.000Z',
    winner_device_id: 'DEV-OTHER',
    reason: 'older-row',
    ...overrides,
  };
}

function makeStubDb(rows: FakeRow[]): CachinkDatabase {
  return {
    all: async () => rows,
  } as unknown as CachinkDatabase;
}

function mountCard(rows: FakeRow[], children: ReactNode): ReactElement {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <DatabaseContext.Provider value={makeStubDb(rows)}>
        <View padding={16} backgroundColor="#F7F7F5">
          {children}
        </View>
      </DatabaseContext.Provider>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof ConflictosRecientesCard> = {
  title: 'Phase 1D / Director Home / Conflictos Recientes',
  component: ConflictosRecientesCard,
};
export default meta;

type Story = StoryObj<typeof ConflictosRecientesCard>;

/** Empty: card collapses to nothing — show a placeholder hint instead. */
export const Empty: Story = {
  render: () =>
    mountCard(
      [],
      <View
        padding={20}
        backgroundColor="#F2F2F0"
        borderColor="#0D0D0D"
        borderWidth={2}
        borderRadius={12}
      >
        (placeholder — card renders nothing when there are zero conflicts)
      </View>,
    ),
};

export const OneConflict: Story = {
  render: () => mountCard([makeRow()], <ConflictosRecientesCard />),
};

export const FiveConflicts: Story = {
  render: () =>
    mountCard(
      [
        makeRow({ id: 1, table_name: 'sales', reason: 'older-row' }),
        makeRow({ id: 2, table_name: 'expenses', reason: 'newer-row' }),
        makeRow({ id: 3, table_name: 'products', reason: 'older-row' }),
        makeRow({ id: 4, table_name: 'inventory_movements', reason: 'older-row' }),
        makeRow({ id: 5, table_name: 'clients', reason: 'older-row' }),
      ],
      <ConflictosRecientesCard />,
    ),
};
