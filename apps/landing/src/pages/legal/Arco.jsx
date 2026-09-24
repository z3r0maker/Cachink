/**
 * `/privacidad/arco` — the public ARCO procedure (N-34): section A of the
 * draft only; section B is the staff's internal annex and is not published.
 */
import procedimiento from '../../../../../docs/legal/aviso/arco-procedimiento.md?raw';

import { LegalPage } from './LegalPage.jsx';

const PUBLICO = procedimiento.split(/\n## B\./)[0];

export default function Arco() {
  return <LegalPage source={PUBLICO} />;
}
