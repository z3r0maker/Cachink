import { pista } from '../../_publico/publico.css';
import { barra, segmento, tira } from './fuerza.css';

type Nivel = 0 | 1 | 2 | 3;

const TONO = { 0: 'neutra', 1: 'mal', 2: 'media', 3: 'bien' } as const;

/** How strong the password reads. The rule itself (8 characters) is the server's. */
export function nivelDe(pw: string): { readonly nivel: Nivel; readonly texto: string } {
  const len = pw.length;
  if (len === 0) return { nivel: 0, texto: 'Mínimo 8 caracteres.' };
  if (len < 8) {
    const n = 8 - len;
    return { nivel: 1, texto: `Te ${n === 1 ? 'falta 1 carácter' : `faltan ${n} caracteres`}.` };
  }
  const variedad = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (len >= 12 || variedad >= 3) return { nivel: 3, texto: 'Muy segura. Así sí.' };
  return { nivel: 2, texto: 'Sirve. Con un número o una frase más larga queda más segura.' };
}

/** Three segments and one sentence under the password field. */
export function Fuerza({ password }: { readonly password: string }) {
  const { nivel, texto } = nivelDe(password);
  const tono = TONO[nivel];
  return (
    <span className={tira}>
      <span className={barra} aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={segmento[i <= nivel ? tono : 'neutra']} />
        ))}
      </span>
      <span className={pista[tono]}>{texto}</span>
    </span>
  );
}
