/**
 * The rows a spec composes onto its own tenant (`tenant.ts`). They live in
 * `@xangarro/testing/tenant` since S-02 (ADR-153 §4); this file re-exports
 * them so no spec's import changed.
 */
export {
  addDevice,
  addExpense,
  addExpenseReceipt,
  addLogo,
  addOperator,
  addProduct,
  addProductPhoto,
  addSale,
  type ExpenseRow,
  type OperatorRow,
  type ProductRow,
  type SaleRow,
} from '@xangarro/testing/tenant';
