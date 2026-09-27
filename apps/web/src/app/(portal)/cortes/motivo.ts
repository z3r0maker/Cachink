import { MOTIVOS_DIFERENCIA, type MotivoDiferencia } from '@xangarro/caja/cierre';

/**
 * The close's reason as the operator chose it (`@xangarro/caja` vocabulario). The
 * record keeps the domain's enum, which folds two of the four reasons into
 * one value per direction: «Otra razón» always carries the operator's note and
 * «Venta no registrada» never does, so the note tells them apart. Older values
 * the register no longer writes keep a plain name.
 */
const POR_VALOR: Readonly<Record<string, string>> = {
  'error-en-cambio': 'Cambio mal dado',
  'retiro-autorizado': 'Salió un vale',
  'gasto-no-registrado': 'Gasto sin registrar',
  'faltante-sin-explicacion': 'Sin explicación',
};

const esMotivo = (m: string): m is MotivoDiferencia =>
  (MOTIVOS_DIFERENCIA as readonly string[]).includes(m);

export function motivoLegible(motivo: string, nota: string | null | undefined): string {
  if (esMotivo(motivo)) return motivo;
  const nombre = POR_VALOR[motivo];
  if (nombre !== undefined) return nombre;
  if (motivo === 'otro' || motivo === 'sobrante') {
    return nota ? 'Otra razón' : 'Venta no registrada';
  }
  return 'Otra razón';
}
