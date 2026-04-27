import { describe, it, expect, vi } from 'vitest';
import { InitialsAvatar, distillInitials } from '../src/components/InitialsAvatar/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

describe('distillInitials', () => {
  it('keeps the first 2 letters of a single-token name in uppercase', () => {
    expect(distillInitials('Pedro')).toBe('PE');
  });

  it('joins the first letter of up to 3 tokens', () => {
    expect(distillInitials('Pedro Espinoza Reyes')).toBe('PER');
  });

  it('caps at 3 tokens even when more are provided', () => {
    expect(distillInitials('Maria Jose de la Cruz')).toBe('MJD');
  });

  it('uppercases lowercase inputs', () => {
    expect(distillInitials('pedro espinoza')).toBe('PE');
  });

  it('returns the placeholder dot for an empty / blank input', () => {
    expect(distillInitials('')).toBe('·');
    expect(distillInitials('   ')).toBe('·');
  });

  it('handles a single-character token without slicing past the end', () => {
    expect(distillInitials('A')).toBe('A');
  });

  it('passes through 2-char uppercase abbreviations verbatim', () => {
    expect(distillInitials('PE')).toBe('PE');
  });

  it('passes through 3-char uppercase abbreviations verbatim (DIR stays DIR)', () => {
    expect(distillInitials('DIR')).toBe('DIR');
    expect(distillInitials('CEO')).toBe('CEO');
  });

  it('truncates uppercase strings longer than 3 chars to first 2', () => {
    expect(distillInitials('OPERA')).toBe('OP');
  });
});

describe('InitialsAvatar', () => {
  it('renders the distilled initials inside the avatar', () => {
    renderWithProviders(<InitialsAvatar value="Pedro Espinoza" />);
    const text = screen.getAllByTestId('initials-avatar-text')[0]!;
    expect(text.textContent).toBe('PE');
  });

  it('forwards an explicit testID to the root view', () => {
    renderWithProviders(<InitialsAvatar value="DIR" testID="role-avatar-director" />);
    expect(screen.getAllByTestId('role-avatar-director').length).toBeGreaterThan(0);
  });

  it('uses the brand variant by default (yellow background)', () => {
    renderWithProviders(<InitialsAvatar value="PE" testID="ia-default" />);
    const root = screen.getAllByTestId('ia-default')[0]!;
    expect(getComputedStyle(root).backgroundColor.toLowerCase()).toContain('rgb(255, 214, 10)');
  });

  it('renders the dark variant with black background', () => {
    renderWithProviders(<InitialsAvatar value="DIR" variant="dark" testID="ia-dark" />);
    const root = screen.getAllByTestId('ia-dark')[0]!;
    const bg = getComputedStyle(root).backgroundColor.toLowerCase();
    expect(bg.includes('rgb(13, 13, 13)') || bg.includes('rgb(0, 0, 0)')).toBe(true);
  });

  it('marks itself role=button when onPress is provided', () => {
    renderWithProviders(<InitialsAvatar value="PE" onPress={() => null} testID="ia-tappable" />);
    const root = screen.getAllByTestId('ia-tappable')[0]!;
    expect(root.getAttribute('role')).toBe('button');
  });

  it('marks itself role=img when display-only', () => {
    renderWithProviders(<InitialsAvatar value="PE" testID="ia-display" />);
    const root = screen.getAllByTestId('ia-display')[0]!;
    expect(root.getAttribute('role')).toBe('img');
  });

  it('fires onPress when tapped', () => {
    const onPress = vi.fn();
    renderWithProviders(<InitialsAvatar value="PE" onPress={onPress} testID="ia-press" />);
    const root = screen.getAllByTestId('ia-press')[0]!;
    fireEvent.click(root);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to the displayed initials as the aria-label', () => {
    renderWithProviders(<InitialsAvatar value="Pedro Espinoza" testID="ia-aria" />);
    const root = screen.getAllByTestId('ia-aria')[0]!;
    expect(root.getAttribute('aria-label')).toBe('PE');
  });

  it('accepts an explicit ariaLabel that overrides the initials', () => {
    renderWithProviders(
      <InitialsAvatar
        value="Pedro Espinoza"
        ariaLabel="Avatar de Pedro Espinoza"
        testID="ia-aria-explicit"
      />,
    );
    const root = screen.getAllByTestId('ia-aria-explicit')[0]!;
    expect(root.getAttribute('aria-label')).toBe('Avatar de Pedro Espinoza');
  });
});
