import { pista } from '../../_publico/publico.css';

/** «Te faltan 3 caracteres.» · «Largo suficiente.»: the length, live. The rule is the server's. */
export function PistaLargo({ password }: { readonly password: string }) {
  const len = password.length;
  if (len === 0) return <p className={pista.neutra}>Mínimo 8 caracteres.</p>;
  if (len >= 8) return <p className={pista.bien}>Largo suficiente.</p>;
  const n = 8 - len;
  return <p className={pista.mal}>Te {n === 1 ? 'falta 1 carácter' : `faltan ${n} caracteres`}.</p>;
}

/** «Coinciden.» · «Todavía no coinciden.» under the second field. */
export function PistaIgual({
  password,
  otra,
}: {
  readonly password: string;
  readonly otra: string;
}) {
  if (otra === '') return <p className={pista.neutra}>Para que no haya errores de dedo.</p>;
  if (otra === password) return <p className={pista.bien}>Coinciden.</p>;
  return <p className={pista.mal}>Todavía no coinciden.</p>;
}
