import { describe, expect, it, vi } from 'vitest';
import { TamaguiProvider } from '@tamagui/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { initI18n } from '../../i18n/index';
import { tamaguiConfig } from '../../tamagui.config';
import { ConfirmDialog } from './confirm-dialog';

initI18n();

function renderWithProviders(ui: ReturnType<typeof ConfirmDialog>) {
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      {ui}
    </TamaguiProvider>,
  );
}

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProviders(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar producto"
        confirmLabel="Eliminar"
      />,
    );

    expect(screen.queryByTestId('confirm-dialog')).toBeNull();
  });

  it('renders title, description, confirm label, and default cancel label', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />,
    );

    expect(screen.getByText('Eliminar producto')).toBeDefined();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeDefined();
    expect(screen.getByText('Eliminar')).toBeDefined();
    expect(screen.getByText('Cancelar')).toBeDefined();
  });

  it('uses a custom cancel label when provided', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Salir"
        confirmLabel="Sí, salir"
        cancelLabel="Seguir aquí"
      />,
    );

    expect(screen.getByText('Seguir aquí')).toBeDefined();
  });

  it('calls onClose from the cancel button and the close button', () => {
    const onClose = vi.fn();

    renderWithProviders(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Eliminar producto"
        confirmLabel="Eliminar"
      />,
    );

    tap(screen.getAllByTestId('confirm-dialog-cancel')[0]!);
    tap(screen.getAllByTestId('modal-close')[0]!);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when the confirm button is pressed', async () => {
    const onConfirm = vi.fn();

    renderWithProviders(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Eliminar producto"
        confirmLabel="Eliminar"
      />,
    );

    tap(screen.getAllByTestId('confirm-dialog-confirm')[0]!);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('disables both actions while an async confirm is pending', async () => {
    let resolvePromise: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    renderWithProviders(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Eliminar producto"
        confirmLabel="Eliminar"
      />,
    );

    const confirmButton = screen.getAllByTestId('confirm-dialog-confirm')[0] as HTMLElement;
    const cancelButton = screen.getAllByTestId('confirm-dialog-cancel')[0] as HTMLElement;

    tap(confirmButton);

    await waitFor(() => {
      expect(confirmButton.getAttribute('aria-disabled')).toBe('true');
      expect(cancelButton.getAttribute('aria-disabled')).toBe('true');
    });

    resolvePromise?.();

    // After the promise resolves the buttons return to enabled. On
    // react-native-web (Btn root since audit M-1 STEP0-T01 swap to
    // `<Pressable>`) the `aria-disabled` attribute is *omitted* when
    // the underlying state is false — the HTML-standard behaviour
    // for boolean ARIA states. The previous Tamagui-View root
    // emitted `aria-disabled="false"`, but that was non-standard.
    // We assert the attribute is "not truthy" to be portable across
    // both renderings.
    await waitFor(() => {
      expect(confirmButton.getAttribute('aria-disabled')).not.toBe('true');
      expect(cancelButton.getAttribute('aria-disabled')).not.toBe('true');
    });
  });

  it('uses the danger button styling when tone is danger', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar producto"
        confirmLabel="Eliminar"
        tone="danger"
      />,
    );

    const confirmButton = screen.getAllByTestId('confirm-dialog-confirm')[0] as HTMLElement;
    expect(window.getComputedStyle(confirmButton).backgroundColor).toBe('rgb(255, 71, 87)');
  });
});
