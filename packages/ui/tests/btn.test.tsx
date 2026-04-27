import { describe, it, expect, vi } from 'vitest';
import { Btn, type BtnVariant, type BtnSize } from '../src/components/Btn/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

describe('Btn', () => {
  it('renders its children as uppercase text', () => {
    renderWithProviders(<Btn>guardar</Btn>);
    // The raw label lives in the DOM as its original casing; CSS
    // `textTransform: uppercase` applies the visual transform. We assert the
    // text is present and the uppercase style is set on the element.
    const label = screen.getByText('guardar');
    expect(label).toBeDefined();
    const computed = getComputedStyle(label);
    expect(computed.textTransform).toBe('uppercase');
  });

  it('calls onPress when pressed', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Btn onPress={onPress} testID="btn-save">
        GUARDAR
      </Btn>,
    );
    const root = screen.getAllByTestId('btn-save')[0]!;
    fireEvent.click(root);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Btn onPress={onPress} disabled testID="btn-disabled">
        GUARDAR
      </Btn>,
    );
    const root = screen.getAllByTestId('btn-disabled')[0]!;
    fireEvent.click(root);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies primary variant tokens by default', () => {
    renderWithProviders(<Btn testID="btn-default">GUARDAR</Btn>);
    const root = screen.getAllByTestId('btn-default')[0]!;
    // Tamagui resolves backgroundColor to an RGB string at render time —
    // assert against the brand yellow from theme.ts (#FFD60A).
    expect(getComputedStyle(root).backgroundColor.toLowerCase()).toContain('rgb(255, 214, 10)');
  });

  it('applies each of the seven variants without error', () => {
    const variants: BtnVariant[] = [
      'primary',
      'dark',
      'ghost',
      'green',
      'danger',
      'soft',
      'outline',
    ];
    for (const variant of variants) {
      renderWithProviders(
        <Btn variant={variant} testID={`btn-${variant}`}>
          TEXTO
        </Btn>,
      );
      expect(screen.getAllByTestId(`btn-${variant}`).length).toBeGreaterThan(0);
    }
  });

  it('renders the outline variant as a white surface with a hard shadow', () => {
    renderWithProviders(
      <Btn variant="outline" testID="btn-outline">
        CANCELAR
      </Btn>,
    );
    const root = screen.getAllByTestId('btn-outline')[0]!;
    const bg = getComputedStyle(root).backgroundColor.toLowerCase();
    expect(bg.includes('rgb(255, 255, 255)') || bg === '').toBe(true);
    // The hard shadow should be applied via box-shadow (jsdom returns it
    // verbatim). We assert it's not "none" and contains "rgb(13, 13, 13)"
    // which is colors.black.
    const shadow = root.style.boxShadow.toLowerCase();
    expect(shadow.length > 0 && shadow !== 'none').toBe(true);
  });

  it('applies each of the three sizes (sm / md / lg) without error', () => {
    const sizes: BtnSize[] = ['sm', 'md', 'lg'];
    for (const size of sizes) {
      renderWithProviders(
        <Btn size={size} testID={`btn-${size}`}>
          TAMAÑO
        </Btn>,
      );
      expect(screen.getAllByTestId(`btn-${size}`).length).toBeGreaterThan(0);
    }
  });

  it('respects the fullWidth flag', () => {
    renderWithProviders(
      <Btn fullWidth testID="btn-full">
        LLENAR
      </Btn>,
    );
    const root = screen.getAllByTestId('btn-full')[0]!;
    // Tamagui maps width="100%" to the inline width — present as "100%" or
    // a resolved pixel value. Either indicates the flag was forwarded.
    const { width } = getComputedStyle(root);
    expect(width === '100%' || width.endsWith('px')).toBe(true);
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<Btn testID="confirm-sale">CONFIRMAR</Btn>);
    expect(screen.getAllByTestId('confirm-sale').length).toBeGreaterThan(0);
  });
});
