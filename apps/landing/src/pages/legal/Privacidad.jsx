/** `/privacidad` — the aviso de privacidad integral (N-34). */
import aviso from '../../../../../docs/legal/aviso/aviso-integral.md?raw';

import { buildLegalSchema } from '../../schema-pages.js';
import { LegalPage } from './LegalPage.jsx';

const schema = buildLegalSchema({
  path: '/privacidad/',
  name: 'Aviso de privacidad',
  description:
    'Cómo trata Xangarro tus datos personales, con quién los comparte y cómo ejercer tus derechos ARCO.',
});

export default function Privacidad() {
  return <LegalPage source={aviso} schema={schema} />;
}
