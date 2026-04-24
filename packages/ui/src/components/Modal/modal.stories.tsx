/**
 * Storybook catalog for the `<Modal>` primitive.
 *
 * Storybook runs through `@storybook/react-native-web-vite`, so stories
 * always render the web (centered-dialog) variant — the same path Tauri
 * takes in production. A future RN Storybook target will render the
 * bottom-sheet variant without any story changes (platform-extension
 * pattern from CLAUDE.md §5.3).
 *
 * Each story uses real es-MX copy drawn from the mock's canonical
 * modals (`Nueva Venta`, `Detalle`, etc.) so the catalog doubles as a
 * UX reference for designers. `ControlledModal` mirrors the helper the
 * `<Input>` stories use — wires Storybook args into real open/close
 * state so the close button and backdrop are interactive.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/btn';
import { Input } from '../Input/input';
import { Modal, type ModalProps } from './modal';

interface ControlledModalProps extends Omit<ModalProps, 'open' | 'onClose'> {
  readonly defaultOpen?: boolean;
}

/**
 * Opens the modal by default (so Playwright captures it on first paint)
 * and wires the close / backdrop interactions back to local state.
 */
function ControlledModal(props: ControlledModalProps): ReturnType<typeof Modal> {
  const [open, setOpen] = useState<boolean>(props.defaultOpen ?? true);
  return (
    <View padding={16}>
      <Btn onPress={() => setOpen(true)}>Abrir</Btn>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={props.title}
        emoji={props.emoji}
        testID={props.testID}
      >
        {props.children}
      </Modal>
    </View>
  );
}

const meta: Meta<typeof Modal> = {
  title: 'Phase 1A / Primitives / Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    emoji: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof Modal>;

/** Minimal shape — no title, no emoji, plain body copy. */
export const Default: Story = {
  render: () => (
    <ControlledModal>
      <Text>Contenido sencillo del modal.</Text>
    </ControlledModal>
  ),
};

/** Title-only header — matches the mock's `Detalle` modal. */
export const WithTitle: Story = {
  render: () => (
    <ControlledModal title="Detalle">
      <Text>Detalles de la operación seleccionada.</Text>
    </ControlledModal>
  ),
};

/** Canonical full header — title + emoji — matches the mock's Nueva Venta. */
export const WithTitleAndEmoji: Story = {
  render: () => (
    <ControlledModal title="Nueva Venta" emoji="💰">
      <Text>¿Qué vendiste? Captura el concepto, el monto y el método.</Text>
    </ControlledModal>
  ),
};

/**
 * The most important real usage — a "Nueva Venta" form with inputs and a
 * primary button. Exercises the modal alongside every other Phase 1A
 * primitive shipped so far.
 */
export const NuevaVenta: Story = {
  render: () => (
    <ControlledModal title="Nueva Venta" emoji="💰">
      <Input label="Concepto" value="" onChange={() => undefined} placeholder="¿Qué vendiste?" />
      <Input
        label="Categoría"
        value=""
        onChange={() => undefined}
        options={['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro']}
      />
      <Input label="Monto" value="" onChange={() => undefined} type="number" placeholder="0.00" />
      <Input
        label="Método"
        value=""
        onChange={() => undefined}
        options={['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito']}
      />
      <Btn fullWidth>Guardar Venta</Btn>
    </ControlledModal>
  ),
};

/** Edge case — no title and no emoji, the header shows only the close X. */
export const WithoutHeader: Story = {
  render: () => (
    <ControlledModal>
      <Text>Confirmación sin encabezado.</Text>
    </ControlledModal>
  ),
};

/** Local `<Text>` to avoid adding another primitive import for story copy. */
function Text({ children }: { children: string }): ReturnType<typeof View> {
  return (
    <View>
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 500,
          fontSize: 15,
          color: '#1A1A18',
        }}
      >
        {children}
      </span>
    </View>
  );
}
