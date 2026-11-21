/**
 * The report sheet, a story per board state (M-23, ADR-162): RpHoja's three
 * (the form, «Enviado», «Sin internet»), the three plain-word messages that
 * share its frame (the daily limit, a full queue, a failure) and RpTableta's
 * centred dialog. Example names only; the live sheet reads the session.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { ReportResult } from '@xangarro/application';
import { initI18n } from '../i18n/index';
import { colors } from '../theme';
import { ReportarHoja } from './reportar-hoja';

initI18n();

const SIZES = {
  phone: { width: 390, height: 844 },
  tablet: { width: 1180, height: 820 },
} as const;

function Marco(props: {
  readonly inicial?: ReportResult;
  readonly porEnviar?: number;
  readonly ancho?: boolean;
}): ReactElement {
  const size = props.ancho ? SIZES.tablet : SIZES.phone;
  return (
    <View {...size} backgroundColor={colors.gray200}>
      <ReportarHoja
        open
        onClose={() => undefined}
        onEnviar={async () => 'sent'}
        nombre="Operador de ejemplo"
        porEnviar={props.porEnviar ?? 0}
        ancho={props.ancho}
        inicial={props.inicial}
      />
    </View>
  );
}

const meta: Meta<typeof Marco> = {
  title: 'Reportar/Hoja',
  component: Marco,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Marco>;

/** RpHoja 1: tap what happened and send. */
export const Formulario: Story = {};
/** RpHoja 2: «Gracias. Ya nos llegó.» */
export const Enviado: Story = { args: { inicial: 'sent' } };
/** RpHoja 3: kept on the device, with what waits. */
export const SinInternet: Story = { args: { inicial: 'queued', porEnviar: 1 } };
/** The daily limit, said in plain words. */
export const LimiteDelDia: Story = { args: { inicial: 'limited' } };
/** The device already keeps as many as it holds. */
export const ColaLlena: Story = { args: { inicial: 'queue_full' } };
/** A failure, with a way to try again. */
export const Fallo: Story = { args: { inicial: 'failed' } };
/** RpTableta: the centred dialog, four cards in one row. */
export const Tableta: Story = { args: { ancho: true } };
/** RpTableta «Enviado». */
export const TabletaEnviado: Story = { args: { ancho: true, inicial: 'sent' } };
