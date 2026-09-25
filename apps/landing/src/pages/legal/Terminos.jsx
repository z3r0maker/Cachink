/**
 * `/terminos` — the Términos y Condiciones (L-05), linked from the portal's
 * signup consent. The draft's title note and its open questions for counsel
 * are not published; the banner is a blockquote, which the parser drops.
 */
import borrador from '../../../../../docs/legal/aviso/terminos-borrador.md?raw';

import { buildLegalSchema } from '../../schema-pages.js';
import { LegalPage } from './LegalPage.jsx';

const PUBLICO = borrador
  .split(/\n## Preguntas abiertas/)[0]
  .replace(/^(# .+?)\s*\(borrador[^)]*\)/m, '$1');

const schema = buildLegalSchema({
  path: '/terminos/',
  name: 'Términos y Condiciones',
  description:
    'Las condiciones para usar Xangarro: tu cuenta, planes y cobros recurrentes, cancelación, el Asesor con IA y tus datos.',
});

export default function Terminos() {
  return <LegalPage source={PUBLICO} schema={schema} />;
}
