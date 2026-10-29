/**
 * `/soporte` — the support page the App Store and Google Play listings point
 * to (X-05). A plain text page in the legal pages' layout, rendered from
 * docs/store/soporte.md so the listings and the site share one text.
 */
import source from '../../../../docs/store/soporte.md?raw';

import { buildLegalSchema } from '../schema-pages.js';
import { LegalPage } from './legal/LegalPage.jsx';

const schema = buildLegalSchema({
  path: '/soporte/',
  name: 'Soporte',
  description:
    'Cómo pedir ayuda con Xangarro: el correo de soporte, qué hacer si no puedes vincular un dispositivo o olvidaste tu NIP, y cómo exportar o borrar tus datos.',
});

export default function Soporte() {
  return <LegalPage source={source} schema={schema} />;
}
