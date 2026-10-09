import { describe, it } from 'vitest';
import { renderWithProviders } from './test-utils';
import { initI18n } from '../src/i18n/index';
import { EgresosScreen } from '../src/screens/index';
initI18n();
describe('barrel', () => {
  it('renders through the barrel', () => {
    renderWithProviders(
      <EgresosScreen fecha="2026-10-08" egresos={[]} total={0n} onNuevoEgreso={() => undefined} />,
    );
  });
});
