/** In-memory account deletion ports: a tiny ledger, a directory, and the emails sent. */
import type {
  AccountDeletionStore,
  AccountDirectory,
  DeletionEmail,
  DeletionNotices,
  OpenDeletion,
} from '../../src/cuenta/index.js';

interface Row extends OpenDeletion {
  userId: string;
  token: string;
  undone: boolean;
  erased: boolean;
}

export class FakeStore implements AccountDeletionStore {
  readonly rows: Row[] = [];
  owned: Record<string, { id: string; nombre: string }[]> = {};
  failRequest = false;
  erased: string[] = [];
  constructor(readonly now: () => Date) {}

  request(input: {
    userId: string;
    email: string;
    stoppedRenewals: readonly string[];
    days: number;
  }) {
    if (this.failRequest) return Promise.reject(new Error('db down'));
    const owned = this.owned[input.userId] ?? [];
    const row: Row = {
      folio: `EL-00000${this.rows.length + 1}`,
      email: input.email,
      userId: input.userId,
      businessIds: owned.map((b) => b.id),
      negocios: owned.map((b) => b.nombre),
      stoppedRenewals: input.stoppedRenewals,
      eraseAt: new Date(this.now().getTime() + input.days * 86_400_000).toISOString(),
      reminded: false,
      token: `tok${this.rows.length + 1}`,
      undone: false,
      erased: false,
    };
    this.rows.push(row);
    return Promise.resolve({
      folio: row.folio,
      eraseAt: row.eraseAt,
      businessIds: row.businessIds,
      undoToken: row.token,
    });
  }
  #pending = (r: Row) => !r.undone && !r.erased && Date.parse(r.eraseAt) > this.now().getTime();
  peek(token: string) {
    const r = this.rows.find((x) => x.token === token);
    if (!r) return Promise.resolve(null);
    const estado = this.#pending(r) ? ('pendiente' as const) : ('vencido' as const);
    return Promise.resolve({
      folio: r.folio,
      email: r.email,
      eraseAt: r.eraseAt,
      negocios: r.negocios,
      estado,
    });
  }
  undo(token: string) {
    const r = this.rows.find((x) => x.token === token);
    if (!r || !this.#pending(r)) return Promise.resolve(null);
    r.undone = true;
    return Promise.resolve({
      folio: r.folio,
      userId: r.userId,
      businessIds: r.businessIds,
      stoppedRenewals: r.stoppedRenewals,
    });
  }
  open(until: string) {
    return Promise.resolve(this.rows.filter((r) => !r.undone && !r.erased && r.eraseAt <= until));
  }
  markReminded(folio: string) {
    const r = this.rows.find((x) => x.folio === folio);
    if (!r || r.reminded) return Promise.resolve(null);
    r.reminded = true;
    return Promise.resolve(`rem-${folio}`);
  }
  erase(folio: string) {
    const r = this.rows.find((x) => x.folio === folio);
    if (!r || r.erased) return Promise.reject(new Error('not due'));
    r.erased = true;
    this.erased.push(folio);
    return Promise.resolve('2036-12-04T12:00:00.000Z');
  }
}

export class FakeDirectory implements AccountDirectory {
  constructor(
    readonly password: string,
    readonly store: FakeStore,
  ) {}
  passwordMatches(_email: string, password: string) {
    return Promise.resolve(password === this.password);
  }
  ownedBusinesses(userId: string) {
    return Promise.resolve(this.store.owned[userId] ?? []);
  }
}

export class RecordingNotices implements DeletionNotices {
  readonly sent: { kind: string; n: DeletionEmail & Record<string, unknown> }[] = [];
  fail = false;
  #send(kind: string, n: DeletionEmail & Record<string, unknown>) {
    if (this.fail) return Promise.reject(new Error('provider down'));
    this.sent.push({ kind, n });
    return Promise.resolve();
  }
  requested(n: DeletionEmail & { requestedAt: string; undoToken: string }) {
    return this.#send('requested', n);
  }
  reminder(n: DeletionEmail & { undoToken: string }) {
    return this.#send('reminder', n);
  }
  erased(n: DeletionEmail & { blockedUntil: string }) {
    return this.#send('erased', n);
  }
}
