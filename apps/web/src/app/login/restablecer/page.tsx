import { ResetForm } from './form';

/**
 * The reset link lands here. The token is read on the server and handed to the
 * form; it is spent only when the new password is saved, so a mail scanner
 * that opens the link spends nothing.
 *
 * `confirmado=1` comes from a sign-in link that claimed an unconfirmed account
 * (N-83): the same form, with a line on why the old password is gone.
 */
export const dynamic = 'force-dynamic';

export default async function RestablecerPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ t?: string; confirmado?: string }>;
}) {
  const { t, confirmado } = await searchParams;
  return <ResetForm token={t ?? ''} confirmado={confirmado === '1'} />;
}
