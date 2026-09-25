/**
 * `/privacidad/arco` — the public ARCO procedure (N-34): section A of the
 * draft only; section B is the staff's internal annex and is not published.
 */
import procedimiento from '../../../../../docs/legal/aviso/arco-procedimiento.md?raw';

import { buildLegalSchema } from '../../schema-pages.js';
import { LegalPage } from './LegalPage.jsx';

const PUBLICO = procedimiento.split(/\n## B\./)[0];

const schema = buildLegalSchema({
  path: '/privacidad/arco/',
  name: 'Derechos ARCO',
  description:
    'Cómo pedir acceso, rectificación, cancelación u oposición sobre tus datos personales en Xangarro, y en qué plazos respondemos.',
});

export default function Arco() {
  return <LegalPage source={PUBLICO} schema={schema} />;
}
