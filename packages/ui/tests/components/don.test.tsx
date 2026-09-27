/**
 * Don component tests.
 *
 * The native Don mirrors the web's: same pose names, same `pose` / `size` /
 * `alt` props, decorative unless given words.
 */

import { describe, expect, it } from 'vitest';
import { Don, DON_POSES } from '../../src/components/Don/index';
import { renderWithProviders, screen } from '../test-utils';

describe('Don', () => {
  it('knows the nine poses the web draws', () => {
    expect([...DON_POSES].sort()).toEqual(
      [
        'ayuda',
        'caminando',
        'celebrando',
        'contando',
        'hola',
        'pensando',
        'preocupado',
        'quieto',
        'senalando',
      ].sort(),
    );
  });

  it.each(DON_POSES)('renders the %s pose as an image', (pose) => {
    renderWithProviders(<Don pose={pose} />);
    const root = screen.getByTestId(`don-${pose}`);
    expect(root.querySelector('img')).not.toBeNull();
  });

  it('is 160 px square by default and honours size', () => {
    renderWithProviders(<Don pose="hola" testID="don-default" />);
    renderWithProviders(<Don pose="hola" size={96} testID="don-small" />);
    const imageBox = (id: string) => screen.getByTestId(id).firstElementChild as HTMLElement;
    expect(imageBox('don-default').style.width).toBe('160px');
    expect(imageBox('don-small').style.width).toBe('96px');
    expect(imageBox('don-small').style.height).toBe('96px');
  });

  it('is decorative by default', () => {
    renderWithProviders(<Don pose="quieto" />);
    expect(screen.queryByRole('img', { name: /./ })).toBeNull();
  });

  it('carries its alt as the accessible name when given', () => {
    renderWithProviders(<Don pose="celebrando" alt="Don Cuentas celebra" />);
    expect(screen.getByLabelText('Don Cuentas celebra')).toBeInTheDocument();
  });
});
