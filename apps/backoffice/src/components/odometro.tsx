import * as o from '@/styles/mostrador-odometro.css';

type Digito = keyof typeof o.digito;

const esDigito = (ch: string): ch is Digito => ch >= '0' && ch <= '9';

/**
 * A figure that rolls like an odometer to its real value (ADR-161, «Odómetro»).
 *
 * It is rendered on the server at its final digits, so it needs no script and
 * never shows `$0`. The rolling digits are `aria-hidden` and carry no text:
 * each is a strip of generated content and a class, each comma or sign is
 * drawn from its `data-c`. Beside them, a visually hidden copy of `texto` is
 * the figure's only text: what screen readers announce, what copying takes
 * and what the Playwright specs read (`data-cifra`). `texto` arrives
 * formatted at the edge — money by `@xangarro/domain` from integer centavos.
 * A figure without digits («Sin datos») is plain text.
 */
export function Odometro({
  texto,
  className,
  testId,
}: {
  readonly texto: string;
  readonly className?: string;
  readonly testId?: string;
}) {
  if (![...texto].some(esDigito)) {
    return (
      <span className={className} data-testid={testId} data-cifra="">
        {texto}
      </span>
    );
  }
  return (
    <span className={className} data-testid={testId}>
      <span className={o.odometro} aria-hidden="true">
        {[...texto].map((ch, i) =>
          esDigito(ch) ? (
            <span key={i} className={o.od}>
              <span className={`${o.odTira} ${o.digito[ch]}`} />
            </span>
          ) : (
            <span key={i} className={o.odSep} data-c={ch} />
          ),
        )}
      </span>
      <span className={o.leible} data-cifra="">
        {texto}
      </span>
    </span>
  );
}
