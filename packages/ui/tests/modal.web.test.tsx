import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../src/components/Modal/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

/**
 * Tamagui's `<View>` wires `onPress` through React Native's Pressable system,
 * which on web listens for the full `pointerdown → pointerup → click` sequence
 * rather than a bare `click` event. `tap(el)` dispatches all three so tests
 * mirror a real user tap / mouse click and Pressable fires its handler.
 */
function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('Modal (web variant)', () => {
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
      <Modal open onClose={onClose} testID="venta-modal">
        <span>body content</span>
      </Modal>,
    );
    // Click a child node inside the content — the Dialog's outside-click
    // logic must NOT treat this as a backdrop dismissal. Backdrop and content
    // are DOM siblings (verified in the Tamagui Dialog portal output), so the
    // click does not bubble into the backdrop's handler.
    tap(screen.getByText('body content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('forwards testID to the content root', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} testID="venta-modal">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getAllByTestId('venta-modal').length).toBeGreaterThan(0);
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
