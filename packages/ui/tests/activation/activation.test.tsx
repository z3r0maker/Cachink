/**
 * Activation (A-04): pure helpers, error mapping, persistence against a real
 * SQLite + the contracts mock, and the screen's submit wiring.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MOCK_CODES, startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { DrizzleAppConfigRepository, DrizzleUsersRepository } from '@xangarro/data';
import type { BusinessId } from '@xangarro/domain';
import { ApiClient, DrizzleReferenceDataRepository } from '@xangarro/sync';
import { makeFreshDb } from '../../../data/tests/helpers/fresh-db';
import { APP_CONFIG_KEYS } from '../../src/app-config/index';
import { activationErrorKey } from '../../src/activation/activation-errors';
import { memoryTokenStore, parseActivationRecord } from '../../src/activation/activation-config';
import { persistActivation } from '../../src/activation/use-activate';
import { ActivationScreen } from '../../src/screens/Activation/activation-screen';
import { canSubmitActivation, sanitizeCode } from '../../src/screens/Activation/activation-form';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('activation form helpers', () => {
  it('uppercases, drops excluded glyphs (0 O 1 I) and caps at 8', () => {
    expect(sanitizeCode('k7m3-p9rw')).toBe('K7M3P9RW');
    expect(sanitizeCode('O0I1abcdefghjk')).toBe('ABCDEFGH');
  });
  it('enables submit only with an email shape and a full valid code', () => {
    expect(canSubmitActivation('dueno@negocio.mx', 'K7M3P9RW')).toBe(true);
    expect(canSubmitActivation('dueno@negocio', 'K7M3P9RW')).toBe(false);
    expect(canSubmitActivation('dueno@negocio.mx', 'K7M3P9R')).toBe(false);
  });
});

describe('activationErrorKey', () => {
  it('maps contract codes through the catalog and client conditions to their keys', () => {
    expect(activationErrorKey('CODE_EXPIRED')).toBe('activate.errors.codeExpired');
    expect(activationErrorKey('EMAIL_MISMATCH')).toBe('activate.errors.codeInvalid');
    expect(activationErrorKey('NETWORK')).toBe('activate.errors.network');
  });
  it('falls back to unknown for non-activation or unrecognised codes', () => {
    expect(activationErrorKey('FK_PRODUCT_MISSING')).toBe('activate.errors.unknown');
    expect(activationErrorKey('BAD_RESPONSE')).toBe('activate.errors.unknown');
  });
});

describe('persistActivation (real SQLite + mock server)', () => {
  let mock: RunningMock;
  beforeAll(async () => {
    mock = await startMockServer(0);
  });
  afterAll(async () => {
    await mock.close();
  });

  it('stores the token, bootstraps operators, and writes the activation record', async () => {
    const res = await new ApiClient({ baseUrl: mock.url }).activate({
      email: 'dueno@tacoslaesquina.mx',
      code: MOCK_CODES.valid,
      device: { name: 'Test', platform: 'ios', appVersion: '0.1.0', osVersion: '18' },
    });
    if (!res.ok) throw new Error(res.code);
    const db = makeFreshDb();
    const appConfig = new DrizzleAppConfigRepository(db);
    const tokenStore = memoryTokenStore();
    const referenceData = new DrizzleReferenceDataRepository(db);
    const record = await persistActivation({ referenceData, appConfig, tokenStore }, res.data);
    expect(await tokenStore.get()).toBe(res.data.deviceToken);
    expect(parseActivationRecord(await appConfig.get(APP_CONFIG_KEYS.activation))).toEqual(record);
    expect(await appConfig.get(APP_CONFIG_KEYS.currentBusinessId)).toBe(res.data.businessId);
    expect(await appConfig.get(APP_CONFIG_KEYS.pullSeq)).toBe(String(res.data.bootstrap.serverSeq));
    const users = new DrizzleUsersRepository(db, 'DEV' as never);
    const ops = await users.findAllByBusiness(res.data.businessId as BusinessId);
    expect(ops.map((u) => u.nombre).sort()).toEqual(['Ana', 'Toni']);
  });
});

function typeInto(testID: string, value: string): void {
  const host = screen.getByTestId(testID);
  const input = host.tagName === 'INPUT' ? host : (host.querySelector('input') ?? host);
  fireEvent.change(input, { target: { value } });
}

describe('ActivationScreen', () => {
  it('keeps Vincular inert until both fields are valid, then submits normalised input', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ActivationScreen onSubmit={onSubmit} submitting={false} />);
    fireEvent.click(screen.getAllByTestId('activation-submit')[0]!);
    expect(onSubmit).not.toHaveBeenCalled();
    typeInto('activation-email', ' dueno@tacos.mx ');
    typeInto('activation-code', 'k7m3p9rw');
    fireEvent.click(screen.getAllByTestId('activation-submit')[0]!);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'dueno@tacos.mx', code: 'K7M3P9RW' });
  });

  it('renders the translated error when one is provided', () => {
    renderWithProviders(
      <ActivationScreen
        onSubmit={vi.fn()}
        submitting={false}
        errorKey="activate.errors.codeUsed"
      />,
    );
    expect(screen.getByTestId('activation-error').textContent).toContain('ya se usó');
  });
});
