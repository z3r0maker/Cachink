import { describe, it, expect } from 'vitest';
import { Icon, type IconName } from '../src/components/Icon/index';
import { renderWithProviders, screen } from './test-utils';

describe('Icon', () => {
  it('renders a valid svg with the brand defaults', () => {
    renderWithProviders(<Icon name="home" testID="icon-home-default" />);
    const el = screen.getAllByTestId('icon-home-default')[0]!;
    expect(el.tagName.toLowerCase()).toBe('svg');
  });

  it('marks decorative icons aria-hidden when no ariaLabel is provided', () => {
    renderWithProviders(<Icon name="home" testID="icon-decorative" />);
    const el = screen.getAllByTestId('icon-decorative')[0]!;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('exposes role=img + aria-label when ariaLabel is supplied', () => {
    renderWithProviders(<Icon name="dollar-sign" testID="icon-meaningful" ariaLabel="Ventas" />);
    const el = screen.getAllByTestId('icon-meaningful')[0]!;
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('Ventas');
    expect(el.getAttribute('role')).toBe('img');
  });

  it('exposes the same color as background fill via stroke', () => {
    renderWithProviders(<Icon name="check" testID="icon-stroke" color="#00C896" />);
    const el = screen.getAllByTestId('icon-stroke')[0]!;
    expect(el.getAttribute('stroke')).toBe('#00C896');
  });

  it('forwards size and stroke-width', () => {
    renderWithProviders(<Icon name="settings" testID="icon-sized" size={32} strokeWidth={2.5} />);
    const el = screen.getAllByTestId('icon-sized')[0]!;
    expect(el.getAttribute('width')).toBe('32');
    expect(el.getAttribute('height')).toBe('32');
    expect(el.getAttribute('stroke-width')).toBe('2.5');
  });

  it('uses currentColor by default so it inherits text color', () => {
    renderWithProviders(<Icon name="check" testID="icon-currentcolor" />);
    const el = screen.getAllByTestId('icon-currentcolor')[0]!;
    expect(el.getAttribute('stroke')).toBe('currentColor');
  });

  it('respects an explicit color prop', () => {
    renderWithProviders(<Icon name="circle-alert" testID="icon-colored" color="#FF4757" />);
    const el = screen.getAllByTestId('icon-colored')[0]!;
    expect(el.getAttribute('stroke')).toBe('#FF4757');
  });

  it.each<IconName>([
    'home',
    'layout-dashboard',
    'layout-grid',
    'settings',
    'ellipsis',
    'dollar-sign',
    'banknote',
    'wallet',
    'coins',
    'hand-coins',
    'credit-card',
    'receipt',
    'archive',
    'package',
    'scan-barcode',
    'shopping-bag',
    'chart-bar',
    'trending-up',
    'trending-down',
    'plus',
    'minus',
    'x',
    'check',
    'share-2',
    'pencil',
    'trash-2',
    'users',
    'user',
    'bell',
    'circle-alert',
    'info',
    'file-text',
    'chevron-up',
    'chevron-down',
    'chevron-left',
    'chevron-right',
  ])('resolves the %s icon to a real svg component', (name) => {
    renderWithProviders(<Icon name={name} testID={`icon-${name}`} />);
    const el = screen.getAllByTestId(`icon-${name}`)[0]!;
    expect(el.tagName.toLowerCase()).toBe('svg');
  });

  it('falls back to a deterministic testID when none is supplied', () => {
    renderWithProviders(<Icon name="bell" />);
    expect(screen.getAllByTestId('icon-bell').length).toBeGreaterThan(0);
  });
});
