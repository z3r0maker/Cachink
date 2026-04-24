import { describe, it, expect } from 'vitest';
import { initI18n, i18n, useTranslation } from '../src/i18n/index';
import { renderWithProviders, screen } from './test-utils';

// Initialize once for the whole suite — initI18n is idempotent so per-test
// invocations would be safe too.
initI18n();

describe('i18n.initI18n', () => {
  it('returns an initialized i18next instance', () => {
    const inst = initI18n();
    expect(inst.isInitialized).toBe(true);
  });

  it('is idempotent — a second call returns the same instance', () => {
    const a = initI18n();
    const b = initI18n();
    expect(a).toBe(b);
    expect(b).toBe(i18n);
  });
});

describe('i18n.t (raw)', () => {
  it('translates an action key', () => {
    expect(i18n.t('actions.save')).toBe('Guardar');
  });

  it('translates a role key', () => {
    expect(i18n.t('roles.operativo')).toBe('Operativo');
    expect(i18n.t('roles.director')).toBe('Director');
  });

  it('returns the key (not undefined / null) for an unknown lookup', () => {
    // Cast to string — TS module augmentation rejects the unknown key at
    // compile time but at runtime i18next returns the raw key on miss.
    const out = i18n.t('actions.does-not-exist' as unknown as 'actions.save');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('useTranslation hook', () => {
  function Greeting(): React.ReactElement {
    const { t } = useTranslation();
    return <span data-testid="greet">{t('common.loading')}</span>;
  }

  it('produces the same translated strings inside a rendered component', () => {
    renderWithProviders(<Greeting />);
    expect(screen.getByTestId('greet').textContent).toBe('Cargando…');
  });
});
