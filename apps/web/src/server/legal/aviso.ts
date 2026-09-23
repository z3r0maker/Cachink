import 'server-only';

import type { AvisoVigente } from '@xangarro/domain';
import { createHash } from 'node:crypto';

import { AVISO_VERSION, avisoTextoCanonico } from '../../legal/aviso-simplificado';

/**
 * The aviso the signup use case records: its version and the SHA-256 of the
 * canonical text. Computed once per process — the text is a constant.
 */
let cached: AvisoVigente | null = null;

export function avisoVigente(): AvisoVigente {
  cached ??= {
    version: AVISO_VERSION,
    sha256: createHash('sha256').update(avisoTextoCanonico(), 'utf8').digest('hex'),
  };
  return cached;
}

/** The IP as the ledger stores it (ADR-079): a hash, never the address. */
export function ipHash(ip: string): string {
  return ip === '' ? '' : createHash('sha256').update(ip, 'utf8').digest('hex');
}
