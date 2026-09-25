/**
 * The 404: a corte de caja that came out one page short, reviewed by Don
 * Cuentas. Vercel serves dist/404.html for any path the site does not have;
 * the prerender writes it with a noindex and no canonical. The receipt is
 * real HTML so the joke reaches crawlers and screen readers, not just eyes.
 * Layout and the one-shot sequence live in not-found.css; the page needs no
 * script, so main.jsx leaves the served 404.html alone.
 */
import { ARTICLES } from '../articles.js';
import { DonCuentas } from '../../home/icons.jsx';

const CORTE = [
  { k: 'Página esperada', v: '1' },
  { k: 'Página encontrada', v: '0' },
  { k: 'Diferencia', v: '−1 página', cls: 'nf-diff' },
  { k: 'Estado', v: 'Faltante', cls: 'nf-stamp' },
];

function Corte() {
  return (
    <table className="nf-table" aria-label="Corte de caja de esta página">
      <caption className="xeyebrow">Corte de caja · error 404</caption>
      <tbody>
        {CORTE.map(({ k, v, cls }) => (
          <tr key={k} className={cls}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Chat() {
  return (
    <div className="dc-row nf-chat">
      <DonCuentas size={44} />
      <div className="dc-stack">
        <span className="dc-typing nf-typing" aria-hidden="true">
          <span className="nf-dot" />
          <span className="nf-dot" />
          <span className="nf-dot" />
        </span>
        <div className="dc-bubble hi nf-bubble">
          Revisé todos los registros. Esta página no está en ventas, no está en gastos y nadie la
          anotó como fiada. Lo que sí cuadra está aquí abajo.
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <main className="nf" data-page="404">
      <div className="nf-grid">
        <h1 className="nf-title">Esta página no cuadra.</h1>
        <picture className="nf-art">
          <source srcSet="/assets/404-don-cuentas.webp" type="image/webp" />
          <img
            src="/assets/404-don-cuentas.png"
            alt="Don Cuentas, la moneda con lentes y bigote, revisa un ticket sellado 404"
            width={665}
            height={850}
            loading="eager"
            decoding="async"
          />
        </picture>
        <div className="nf-receipt">
          <Corte />
        </div>
        <Chat />
        <div className="nf-actions">
          <a href="/" className="xbtn xbtn-dark">
            Volver al inicio
          </a>
          <a href="/recursos/" className="xbtn">
            Ver las guías
          </a>
        </div>
      </div>

      <nav className="nf-guides" aria-label="Guías">
        <h2>Registrado y en existencia</h2>
        <ul className="nf-chips">
          {ARTICLES.map((a) => (
            <li key={a.slug}>
              <a href={`/recursos/${a.slug}/`} className="xtag">
                {a.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="nf-foot">Error 404 · La caja sigue cobrando.</p>
      </nav>
    </main>
  );
}
