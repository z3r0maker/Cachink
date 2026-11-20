import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { passkeyName } from '@/server/auth/passkey-names';

describe('passkeyName', () => {
  it('names the common providers by their AAGUID', () => {
    assert.equal(passkeyName('fbfc3007-154e-4ecc-8c0b-6e020557d7bd', true), 'Llavero de iCloud');
    assert.equal(
      passkeyName('EA9B8D66-4D01-1D21-3CE4-B6B48CB575D4', true),
      'Administrador de contraseñas de Google',
    );
  });

  it('describes an unknown provider by whether it syncs', () => {
    const none = '00000000-0000-0000-0000-000000000000';
    assert.equal(passkeyName(none, true), 'Llave sincronizada');
    assert.equal(passkeyName(none, false), 'Llave de este equipo');
  });
});
