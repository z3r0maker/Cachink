/**
 * `@xangarro/testing/tenant`: the tenant fixtures in one place (ADR-128,
 * ADR-153 §4). A tenant of its own, the rows composed onto it, its activation
 * codes, and the wire rows its phone pushes.
 *
 * Node-only (Postgres, `node:crypto`), so it is a subpath of its own and never
 * part of the browser-safe root export. Nothing here knows Playwright: the
 * portal's `apps/web/e2e/*` keep the sign-in walk and the HTTP calls, and
 * re-export the rest. Synth's corrida stack mints its runs' tenants here too.
 */
export { asOwner, asTenant } from './connection.js';
export { codeOf, freeSlots, mintCodeFor } from './codes.js';
export { resetThrottle, seedDoorProducts, type ProductoPuerta } from './door.js';
export {
  addMember,
  clientIp,
  mintTenant,
  stamp,
  subscriptionIdOf,
  type Account,
  type MemberRole,
  type MintOptions,
  type Plan,
  type Status,
  type Tenant,
} from './mint.js';
export {
  gasto,
  respuesta,
  turno,
  type Cierre,
  type GastoRow,
  type TurnoRow,
} from './phone-rows.js';
export {
  portalServerEnv,
  TEST_ENTITLEMENT_KEY,
  TEST_TOTP_KEY,
  type PortalEnvInput,
} from './portal-env.js';
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
} from './rows.js';
export {
  appDatabaseUrl,
  billingDatabaseUrl,
  FixtureDatabaseError,
  superDatabaseUrl,
} from './urls.js';
export {
  BIZ,
  client,
  CNF,
  CNF_PRODUCT,
  DEV,
  sale,
  TACO,
  ticket,
  type Phone,
  type PhoneIdentity,
} from './wire.js';
