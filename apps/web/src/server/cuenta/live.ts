import 'server-only';

import {
  BorrarCuentasUseCase,
  CancelarEliminacionUseCase,
  EliminarCuentaUseCase,
  type AccountDeletionStore,
  type AccountDirectory,
  type Billing,
} from '@xangarro/application/cuenta';
import {
  eraseAccount,
  markDeletionReminded,
  openAccountDeletions,
  peekAccountDeletion,
  requestAccountDeletion,
  undoAccountDeletion,
} from '@xangarro/data-pg';

import { billingDb, stripeClient } from '../billing/config';
import { stripeGateway } from '../billing/gateway';
import { pgBillingRepository } from '../billing/repository';
import { db } from '../db';
import { portalEmailSender } from '../email/sender';
import { negociosOf } from '../memberships';
import { reportError } from '../observability/report';
import { passwordMatches } from '../password';
import { deletionNotices } from './notices';

/**
 * The composition root of account deletion (ADR-136). The ledger runs on the
 * app role through `xangarro.account_*` definers; the subscriptions on the
 * billing connection. Stripe is built only when a subscription needs it, so an
 * owner on Xangarrito deletes with no Stripe configured at all.
 */
function store(): AccountDeletionStore {
  return {
    request: (input) => requestAccountDeletion(db(), input),
    peek: (token) => peekAccountDeletion(db(), token),
    undo: (token) => undoAccountDeletion(db(), token),
    open: (until) => openAccountDeletions(db(), until),
    markReminded: (folio) => markDeletionReminded(db(), folio),
    erase: (folio) => eraseAccount(db(), folio),
  };
}

function billing(): Billing {
  const stripe = () => stripeGateway(stripeClient());
  return {
    repo: pgBillingRepository(billingDb()),
    gateway: {
      setCancelAtPeriodEnd: (id, cancel) => stripe().setCancelAtPeriodEnd(id, cancel),
      cancelSubscription: (id) => stripe().cancelSubscription(id),
      retrieveSubscription: (id) => stripe().retrieveSubscription(id),
    },
  };
}

const directory: AccountDirectory = {
  passwordMatches: async (email, password) => (await passwordMatches(email, password)) !== null,
  ownedBusinesses: async (userId) =>
    (await negociosOf(userId))
      .filter((n) => n.role === 'owner')
      .map((n) => ({ id: n.businessId, nombre: n.nombre })),
};

const notices = (origin: string) => deletionNotices({ sender: portalEmailSender(), origin });

export function liveEliminarCuenta(origin: string) {
  return new EliminarCuentaUseCase({
    store: store(),
    accounts: directory,
    billing: billing(),
    notices: notices(origin),
    report: (error) => reportError(error, { endpoint: 'cuenta/eliminar' }),
    now: () => new Date(),
  });
}

export function liveCancelarEliminacion() {
  return new CancelarEliminacionUseCase({
    store: store(),
    billing: billing(),
    report: (error) => reportError(error, { endpoint: 'cuenta/deshacer' }),
  });
}

export function liveBorrarCuentas(origin: string) {
  return new BorrarCuentasUseCase({
    store: store(),
    billing: billing(),
    notices: notices(origin),
    report: (error) => reportError(error, { endpoint: 'cron/borrar-cuentas' }),
  });
}
