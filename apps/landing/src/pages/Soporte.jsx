/**
 * `/soporte` — the support page the App Store and Google Play listings point
 * to (X-05), and the public «Eliminar tu cuenta» Google Play asks for
 * (ADR-136). Laid out as the ElSoporte board from docs/store/soporte.md, so
 * the listings and the site share one text.
 */
import source from '../../../../docs/store/soporte.md?raw';

import { buildLegalSchema } from '../schema-pages.js';
import { soporteDesde } from './soporte/contenido.js';
import { Cabecera, Hero, Pie, Quien } from './soporte/Marco.jsx';
import { Duenio, Eliminar, Preguntas } from './soporte/Secciones.jsx';

const schema = buildLegalSchema({
  path: '/soporte/',
  name: 'Soporte',
  description:
    'Cómo pedir ayuda con Xangarro: el correo de soporte, vincular un dispositivo, un NIP olvidado, y cómo llevarte tus datos o eliminar tu cuenta.',
});

const contenido = soporteDesde(source);

export default function Soporte() {
  return (
    <div className="sp">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Cabecera />
      <Hero intro={contenido.intro} escribe={contenido.escribe} />
      <main id="main-content" className="sp-wrap sp-main">
        <Quien />
        <Preguntas preguntas={contenido.app} />
        <Duenio tarjetas={contenido.duenio} />
        <Eliminar e={contenido.eliminar} />
      </main>
      <Pie legal={contenido.legal} />
    </div>
  );
}
