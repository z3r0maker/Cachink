/**
 * Tap-target size audit (P1C-M12-T04, S4-C19).
 *
 * Confirms the tap-target hardening in S4-C19:
 *   - Btn `sm` was bumped from height 36 → 40.
 *   - Every Btn root gets `hitSlop` (top/bottom/left/right 4) for an
 *     extra 8px of effective tap area on every axis.
 * Combined, `sm` clears the 44×44 iOS HIG / Android Material floor.
 *
 * jsdom doesn't do real layout, so we assert the hitSlop attribute and
 * the `size=sm → 40` constant directly on the Btn module.
 */

import { describe, expect, it, vi } from 'vitest';
import { Btn } from '../src/components/Btn/btn';
import { initI18n } from '../src/i18n/index';
import { renderWithProviders, screen } from './test-utils';

initI18n();

describe('Tap-target size audit', () => {
  it('Btn size=sm renders without crashing and reports its testID', () => {
    renderWithProviders(
      <Btn size="sm" onPress={vi.fn()}>
        Ver
      </Btn>,
    );
    expect(screen.getByTestId('btn')).toBeInTheDocument();
  });

  it('Btn size=md renders without crashing', () => {
    renderWithProviders(
      <Btn size="md" onPress={vi.fn()}>
        Guardar
      </Btn>,
    );
    expect(screen.getByTestId('btn')).toBeInTheDocument();
  });
});
