import 'server-only';

import type {
  CustomerRecipients,
  EmailRecipient,
  OwnerRecipients,
} from '@xangarro/application/email';

/**
 * Who receives billing and usage email (B-14).
 *
 * The owner's address lives in `auth.users`, which the portal's roles cannot
 * read outside a session (only `xangarro.login_lookup` by email, and the
 * session resolver). Billing already copies it to the Stripe customer when
 * the owner starts a trial or subscribes, so the Stripe customer is the
 * recipient for the trial emails. The usage emails, which a free business
 * with no Stripe customer must also get, are addressed through
 * `xangarro.owner_email()` instead (`../usage/owner-notifier.ts`).
 */

/** The slice of the Stripe SDK used; tests pass a fake. */
export interface StripeCustomers {
  customers: {
    retrieve(id: string): Promise<{
      readonly deleted?: boolean | void;
      readonly email?: string | null;
      readonly name?: string | null;
    }>;
  };
}

export function stripeRecipients(stripe: StripeCustomers): CustomerRecipients {
  return {
    async of(customerId): Promise<EmailRecipient | null> {
      const c = await stripe.customers.retrieve(customerId);
      if (c.deleted === true || !c.email) return null; // a DeletedCustomer has no email
      return { email: c.email, name: c.name ?? null };
    },
  };
}

export function ownersViaBilling(
  customerOf: (businessId: string) => Promise<string | null>,
  customers: CustomerRecipients,
): OwnerRecipients {
  return {
    async of(businessId) {
      const customerId = await customerOf(businessId);
      return customerId === null ? null : customers.of(customerId);
    },
  };
}
