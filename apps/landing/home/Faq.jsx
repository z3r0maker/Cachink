import { FAQ_ITEMS } from '../landing/copy.jsx';

/**
 * Every question in FAQ_ITEMS, the same list the FAQPage structured data
 * publishes, so what search engines read is what visitors can open.
 */
export default function Faq() {
  return (
    <section id="faq" className="xh-sec xh-band faq">
      <div className="xh-wrap faq-grid">
        <div className="faq-side">
          <span className="xeyebrow">Preguntas</span>
          <h2 className="xh2">Lo que todos nos preguntan.</h2>
          <p className="xbody">
            ¿Algo más? Escríbenos a <a href="mailto:hola@xangarro.mx">hola@xangarro.mx</a>.
          </p>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((f, i) => (
            <details key={f.q} className="xcard faq-item" open={i === 0}>
              <summary>
                {f.q}
                <span className="faq-plus" aria-hidden="true">+</span>
              </summary>
              <p className="xbody">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
