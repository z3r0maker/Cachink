export * from './cliente/abono';
export * from './cliente/derive';
export * from './cliente/types';
export * from './cuentas';
export * from './antiguedad';
// The web register's account reader lives in './vivo'; its comoCuenta and
// metodoAbonoDe collide with the phone's './lectura' (same names, different
// input rows), so the barrel carries lectura's and the web's three callers
// deep-import '@xangarro/caja/cobranza/vivo' for theirs.
export { inicialesDe, diaCorto } from './vivo';
export * from './derive';
export * from './lectura';
export * from './types';
