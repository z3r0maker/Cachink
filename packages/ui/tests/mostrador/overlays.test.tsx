/**
 * El Mostrador overlays (M-05): the bottom sheet and the centred dialog.
 */
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from '../../src/components/BottomSheet/index';
import { Dialog } from '../../src/components/Dialog/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

initI18n();

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('BottomSheet', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(
      <BottomSheet open={false} onClose={vi.fn()} title="Detalle de venta">
        <span>cuerpo</span>
      </BottomSheet>,
    );
    expect(screen.queryByText('cuerpo')).toBeNull();
  });

  it('shows the eyebrow, the title, the grabber, the body and the sticky footer', () => {
    renderWithProviders(
      <BottomSheet
        open
        onClose={vi.fn()}
        eyebrow="Venta V-0413"
        title="Detalle de venta"
        footer={<span>acciones</span>}
      >
        <span>cuerpo</span>
      </BottomSheet>,
    );
    expect(screen.getByText('Venta V-0413')).toBeInTheDocument();
    expect(screen.getByText('Detalle de venta')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-sheet-grabber')).toBeInTheDocument();
    expect(screen.getByText('cuerpo')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-sheet-footer')).toHaveTextContent('acciones');
  });

  it('closes from the labelled 44 px close square and from the scrim', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <BottomSheet open onClose={onClose} title="Detalle">
        <span />
      </BottomSheet>,
    );
    const close = screen.getByTestId('bottom-sheet-close');
    expect(close.getAttribute('aria-label')).toBe('Cerrar');
    expect(getComputedStyle(close).width).toBe('44px');
    tap(close);
    tap(screen.getByTestId('bottom-sheet-scrim'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('carries the thick black edge on the sheet', () => {
    renderWithProviders(
      <BottomSheet open onClose={vi.fn()} title="Detalle">
        <span>x</span>
      </BottomSheet>,
    );
    const frame = screen.getByTestId('bottom-sheet-grabber').parentElement as HTMLElement;
    expect(getComputedStyle(frame).borderTopWidth).toBe('2.5px');
  });
});

describe('Dialog', () => {
  it('renders the title and footer in a 342 px card with a dialog role', () => {
    renderWithProviders(
      <Dialog open onClose={vi.fn()} title="¿Cancelar la venta?" footer={<span>botones</span>}>
        <span>motivo</span>
      </Dialog>,
    );
    expect(screen.getByText('¿Cancelar la venta?')).toBeInTheDocument();
    expect(screen.getByText('botones')).toBeInTheDocument();
    const content = screen.getByTestId('dialog');
    expect(content.getAttribute('role')).toBe('dialog');
    expect(content.getAttribute('aria-modal')).toBe('true');
    const card = screen.getByTestId('dialog-close').closest('[style*="342"]');
    expect(card).not.toBeNull();
  });

  it('closes from its close square with a black edge', () => {
    const onClose = vi.fn();
    renderWithProviders(<Dialog open onClose={onClose} title="Confirmar" />);
    const close = screen.getByTestId('dialog-close');
    expect(getComputedStyle(close).borderTopColor).toBe('rgb(13, 13, 13)');
    tap(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while closed', () => {
    renderWithProviders(<Dialog open={false} onClose={vi.fn()} title="Confirmar" />);
    expect(screen.queryByText('Confirmar')).toBeNull();
  });
});
