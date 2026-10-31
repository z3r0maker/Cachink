/** «$230.84»: a total with IVA always shows its centavos (display only; money stays integer). */
export function totalConIva(centavos: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}
