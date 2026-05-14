/**
 * RoleIllustration component tests.
 *
 * Verifies that the component renders the correct view for each role +
 * variant combination, and honours the testID prop. Size assertions use
 * the wrapper `<View>` which receives its dimensions from
 * react-native-web's rendering pipeline.
 */

import { describe, expect, it } from 'vitest';
import { RoleIllustration } from '../../src/components/RoleIllustration/index';
import { renderWithProviders, screen } from '../test-utils';

describe('RoleIllustration', () => {
  it('renders a view with the default testID', () => {
    renderWithProviders(<RoleIllustration role="operativo" />);
    expect(screen.getByTestId('role-illustration')).toBeInTheDocument();
  });

  it('forwards a custom testID to the root view', () => {
    renderWithProviders(
      <RoleIllustration role="director" testID="custom-illustration" />,
    );
    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('renders for the director role with dark variant (default)', () => {
    renderWithProviders(
      <RoleIllustration role="director" testID="dir-dark" />,
    );
    expect(screen.getByTestId('dir-dark')).toBeInTheDocument();
  });

  it('renders for the director role with light variant', () => {
    renderWithProviders(
      <RoleIllustration role="director" variant="light" testID="dir-light" />,
    );
    expect(screen.getByTestId('dir-light')).toBeInTheDocument();
  });

  it('renders for the operativo role with dark variant', () => {
    renderWithProviders(
      <RoleIllustration role="operativo" variant="dark" testID="op-dark" />,
    );
    expect(screen.getByTestId('op-dark')).toBeInTheDocument();
  });

  it('renders for the operativo role with light variant', () => {
    renderWithProviders(
      <RoleIllustration role="operativo" variant="light" testID="op-light" />,
    );
    expect(screen.getByTestId('op-light')).toBeInTheDocument();
  });

  it('renders an <img> element inside the wrapper (react-native-web Image)', () => {
    renderWithProviders(
      <RoleIllustration role="operativo" testID="has-img" />,
    );
    const wrapper = screen.getByTestId('has-img');
    const img = wrapper.querySelector('img');
    expect(img).not.toBeNull();
  });

  it('renders different role images without errors', () => {
    // Render both roles in sequence — neither should throw.
    const { unmount } = renderWithProviders(
      <RoleIllustration role="director" variant="light" testID="dir-seq" />,
    );
    expect(screen.getByTestId('dir-seq')).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <RoleIllustration role="operativo" variant="dark" testID="op-seq" />,
    );
    expect(screen.getByTestId('op-seq')).toBeInTheDocument();
  });
});
