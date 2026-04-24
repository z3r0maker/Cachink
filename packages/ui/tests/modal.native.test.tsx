import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../src/components/Modal/modal.native';
import { fireEvent, renderWithProviders, screen } from './test-utils';

/**
 * Vitest runs in jsdom with react-native-web, so the RN-flavored Modal
 * renders via Tamagui's web primitives just like the desktop variant.
 * These tests exercise layout / structure (grab handle + shared header
 * wiring), not platform-native APIs.
 */

/** Dispatches the full `pointerdown → pointerup → click` sequence so Tamagui's
 *  Pressable-driven `onPress` handlers fire (a bare `click` is not enough). */
function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('Modal (native variant)', () => {
  it('renders nothing when open is false', () => {
    renderWithProviders(
      <Modal open={false} onClose={() => undefined}>
        <span>hidden body</span>
      </Modal>,
    );
    expect(screen.queryByText('hidden body')).toBeNull();
  });

  it('renders its children when open is true', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined}>
        <span>visible body</span>
      </Modal>,
    );
    expect(screen.getByText('visible body')).toBeDefined();
  });

  it('renders the title text in the header when provided', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} title="Nueva Venta">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getByText('Nueva Venta')).toBeDefined();
  });

  it('renders the emoji in the header when provided', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} emoji="💰">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getByText('💰')).toBeDefined();
  });

  it('calls onClose when the X close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose} title="Detalle">
        <span>body</span>
      </Modal>,
    );
    tap(screen.getAllByTestId('modal-close')[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose}>
        <span>body</span>
      </Modal>,
    );
    tap(screen.getAllByTestId('modal-backdrop')[0]!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when content itself is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose}>
        <span>body content</span>
      </Modal>,
    );
    tap(screen.getByText('body content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('forwards testID to the content root', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} testID="egreso-modal">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getAllByTestId('egreso-modal').length).toBeGreaterThan(0);
  });

  it('renders the grab handle (absent on desktop)', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} title="Nueva Venta">
        <span>body</span>
      </Modal>,
    );
    // The grab handle is the visual affordance that this is a bottom-sheet.
    // The web variant omits it entirely.
    expect(screen.getAllByTestId('modal-grab-handle').length).toBeGreaterThan(0);
  });

  it('calls onClose when the Escape key is pressed', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose}>
        <span>body</span>
      </Modal>,
    );
    // Tamagui Dialog wires ESC internally and fires onOpenChange(false),
    // which our adapter forwards to props.onClose.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
