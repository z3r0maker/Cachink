import { describe, expect, it } from 'vitest';
import { accionPermisoCamara } from '../src/hooks/permiso-camara';

/**
 * After a refusal iOS never shows its prompt again, so asking does nothing: the
 * only way forward is the app's page in Settings.
 */
describe('accionPermisoCamara', () => {
  it('asks while the system can still show its prompt', () => {
    expect(accionPermisoCamara({ canAskAgain: true })).toBe('pedir');
  });

  it('sends the person to Settings once the system will not ask again', () => {
    expect(accionPermisoCamara({ canAskAgain: false })).toBe('ajustes');
  });

  it('asks while the permission has not loaded yet', () => {
    expect(accionPermisoCamara(null)).toBe('pedir');
  });
});
