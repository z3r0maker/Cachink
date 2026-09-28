/**
 * The caja's shared states (Track M, M-09) for review against the board
 * MvEstados: loading, empty with its action, error with the retry, and the
 * offline strip with the quick notice, in the phone frame.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { initI18n } from '../../i18n/index';
import { MarcoDetalle } from '../../screens/Inventario/marco-detalle';
import { GLYPHS } from '../PathIcon/glyphs';
import { OfflineBanner } from '../OfflineBanner/index';
import { Toast } from '../Toast/index';
import { CajaEstado } from './caja-estado';

initI18n();

type Vista = 'cargando' | 'vacio' | 'falla' | 'sinInternet';

function Demo({ vista }: { vista: Vista }): ReactElement {
  const offline = vista === 'sinInternet';
  return (
    <MarcoDetalle
      ruta="/ventas"
      avisos={2}
      banners={offline ? <OfflineBanner pendientes={1} /> : null}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <CajaEstado
          mode={vista === 'cargando' ? 'loading' : vista === 'falla' ? 'error' : 'empty'}
          emptyTitle="Todavía no hay ventas en este turno"
          emptyBody="En cuanto cobres algo, aparece en esta lista."
          cta={{ label: 'Cobrar la primera', onPress: () => undefined }}
          onRetry={() => undefined}
        />
      </ScrollView>
      {offline ? (
        <Toast
          floating
          tone="warn"
          icon={GLYPHS.sinRed}
          title="Sin internet: se guardó y se envía al volver"
          body="La venta quedó en esta caja. No tienes que hacer nada."
          onClose={() => undefined}
        />
      ) : null}
    </MarcoDetalle>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Estados',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const Cargando: Story = { args: { vista: 'cargando' } };
export const SinNada: Story = { args: { vista: 'vacio' } };
export const Falla: Story = { args: { vista: 'falla' } };
export const SinInternet: Story = { args: { vista: 'sinInternet' } };
