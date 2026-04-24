/**
 * Public surface of `@cachink/domain/format`.
 *
 * Pure presentation helpers — zero IO, zero React, zero Tamagui. The UI
 * layer imports from here to render currency / dates; nothing in domain
 * imports from here (these are leaf formatters).
 */
export { formatMoney, formatMoneyCompact, formatPesos } from './money.js';
export { formatDate, formatDateLong, formatMonth } from './date.js';
