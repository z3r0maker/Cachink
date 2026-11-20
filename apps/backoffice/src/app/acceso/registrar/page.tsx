import { Trastienda } from '@/components/trastienda/trastienda';

import { Registrar } from './registrar';

/**
 * Where a printed enrolment link lands (board CD-20b, ADR-160). Public: the
 * link itself is the credential, and its token rides in the fragment, which
 * the browser never sends, so no request line or log ever holds it.
 */
export default function RegistrarPage() {
  return (
    <Trastienda mood="nuevo">
      <Registrar />
    </Trastienda>
  );
}
