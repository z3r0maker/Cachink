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

  it('renders the subtitle line beneath the title when provided', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} title="Nueva venta" subtitle="24 abr · 10:48">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getByText('24 abr · 10:48')).toBeDefined();
    const subtitle = screen.getAllByTestId('modal-subtitle')[0]!;
    expect(subtitle.textContent).toBe('24 abr · 10:48');
  });

  it('renders a leftAvatar slot when provided and skips the legacy emoji box', () => {
    renderWithProviders(
      <Modal
        open
        onClose={() => undefined}
        title="Nueva venta"
        leftAvatar={<span data-testid="custom-avatar">MR</span>}
        emoji="💰"
      >
        <span>body</span>
      </Modal>,
    );
    expect(screen.getAllByTestId('modal-left-avatar').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('custom-avatar').length).toBeGreaterThan(0);
    // The deprecated emoji box must NOT render when leftAvatar wins.
    expect(screen.queryAllByTestId('modal-emoji').length).toBe(0);
  });

  it('still renders the legacy emoji box when no leftAvatar is provided', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} emoji="💰">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getAllByTestId('modal-emoji').length).toBeGreaterThan(0);
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

  it('renders the close icon and applies the expanded hitSlop to the close button', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined} title="Detalle">
        <span>body</span>
      </Modal>,
    );
    expect(screen.getAllByTestId('icon-x').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('modal-close')[0]).toHaveAttribute(
      'data-hit-slop',
      '{"top":6,"bottom":6,"left":6,"right":6}',
    );
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

  it('positions content with fixed inset:0 + margin:auto (no transform-based centering)', () => {
    renderWithProviders(
      <Modal open onClose={() => undefined}>
        <span>centered body</span>
      </Modal>,
    );
    const content = screen.getAllByTestId('modal')[0]!;
    const style = (content as HTMLElement).style;
    // Either set as inline CSS (browser) or via class attribute (jsdom + Tamagui
    // compiled). The key invariants: no `transform: translate(...)` is being
    // used to center, and `position` is fixed.
    const inline = `${style.cssText} ${(content as HTMLElement).className}`;
    expect(inline).not.toMatch(/translate\(-50%,\s*-50%\)/);
    // Tamagui emits class-based styles in jsdom; we can also assert the
    // computed style after the layout pass.
    const computed = window.getComputedStyle(content);
    expect(computed.position).toBe('fixed');
    expect(computed.margin).toMatch(/auto/);
  });
});
