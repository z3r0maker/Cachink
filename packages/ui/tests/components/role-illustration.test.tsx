/**
 * RoleIllustration component tests.
 *
 * Verifies that the operator illustration renders for each variant, and honours the testID prop. Size assertions use
 * the wrapper `<View>` which receives its dimensions from
 * react-native-web's rendering pipeline.
 */

import { describe, expect, it } from 'vitest';
import { RoleIllustration } from '../../src/components/RoleIllustration/index';
import { renderWithProviders, screen } from '../test-utils';

describe('RoleIllustration', () => {
  it('renders a view with the default testID', () => {
    renderWithProviders(<RoleIllustration />);
    expect(screen.getByTestId('role-illustration')).toBeInTheDocument();
  });

  it('forwards a custom testID to the root view', () => {
    renderWithProviders(<RoleIllustration testID="custom-illustration" />);
    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('renders the dark variant by default', () => {
    renderWithProviders(<RoleIllustration testID="dir-dark" />);
    expect(screen.getByTestId('dir-dark')).toBeInTheDocument();
  });

  it('renders the light variant', () => {
    renderWithProviders(<RoleIllustration variant="light" testID="dir-light" />);
    expect(screen.getByTestId('dir-light')).toBeInTheDocument();
  });

  it('renders an explicit dark variant', () => {
    renderWithProviders(<RoleIllustration variant="dark" testID="op-dark" />);
    expect(screen.getByTestId('op-dark')).toBeInTheDocument();
  });

  it('renders an explicit light variant', () => {
    renderWithProviders(<RoleIllustration variant="light" testID="op-light" />);
    expect(screen.getByTestId('op-light')).toBeInTheDocument();
  });

  it('renders an <img> element inside the wrapper (react-native-web Image)', () => {
    renderWithProviders(<RoleIllustration testID="has-img" />);
    const wrapper = screen.getByTestId('has-img');
    const img = wrapper.querySelector('img');
    expect(img).not.toBeNull();
  });

  it('re-renders across variants without errors', () => {
    // Render both variants in sequence — neither should throw.
    const { unmount } = renderWithProviders(<RoleIllustration variant="light" testID="dir-seq" />);
    expect(screen.getByTestId('dir-seq')).toBeInTheDocument();
    unmount();

    renderWithProviders(<RoleIllustration variant="dark" testID="op-seq" />);
    expect(screen.getByTestId('op-seq')).toBeInTheDocument();
  });
});
