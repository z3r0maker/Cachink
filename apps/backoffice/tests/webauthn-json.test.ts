import assert from 'node:assert/strict';
import { softAuthenticator } from '@xangarro/auth-core/testing';
import { describe, it } from 'vitest';

import { parseAuthentication, parseRegistration } from '@/server/auth/webauthn-json';

const auth = softAuthenticator({ origin: 'https://admin.xangarro.test' });
const created = auth.create({
  challenge: 'Y2hhbGxlbmdl',
  rp: { id: 'admin.xangarro.test', name: 'X' },
  user: { id: 'dXNlcg', name: 'a', displayName: 'A' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
});
const asserted = auth.get(
  { challenge: 'Y2hhbGxlbmdl', rpId: 'admin.xangarro.test' },
  created.passkey,
);

describe('webauthn-json', () => {
  it('accepts what a real authenticator sends, and drops extensions', () => {
    const reg = parseRegistration({
      ...created.response,
      clientExtensionResults: { credProps: { rk: true } },
    });
    assert.ok(reg);
    assert.deepEqual(reg.clientExtensionResults, {});
    assert.equal(reg.id, created.response.id);
    assert.equal(parseAuthentication(asserted)?.response.signature, asserted.response.signature);
  });

  it('refuses something that is not a credential at all', () => {
    for (const junk of [null, 'texto', 42, {}, []]) {
      assert.equal(parseAuthentication(junk), null);
      assert.equal(parseRegistration(junk), null);
    }
  });

  it('refuses a field that is not base64url, or the wrong credential type', () => {
    assert.equal(parseAuthentication({ ...asserted, type: 'password' }), null);
    const bad = { ...asserted, response: { ...asserted.response, signature: 'a+b/c=' } };
    assert.equal(parseAuthentication(bad), null);
  });

  it('takes a post-quantum signature, which runs to kilobytes', () => {
    const mldsa = { ...asserted, response: { ...asserted.response, signature: 'A'.repeat(6170) } };
    assert.ok(parseAuthentication(mldsa));
  });

  it('refuses an oversized field', () => {
    const huge = {
      ...created.response,
      response: { ...created.response.response, attestationObject: 'A'.repeat(20_000) },
    };
    assert.equal(parseRegistration(huge), null);
  });
});
