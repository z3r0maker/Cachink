import { ResetForm } from './form';

/**
 * The reset link lands here. The token is read on the server and handed to the
 * form; it is spent only when the new password is saved, so a mail scanner
 * that opens the link spends nothing.
 */
export const dynamic = 'force-dynamic';

export default async function RestablecerPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return <ResetForm token={t ?? ''} />;
}
