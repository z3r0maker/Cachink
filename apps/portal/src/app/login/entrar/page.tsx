import { EnterButton } from './button';

/**
 * The sign-in link lands here and asks for one tap. Opening the link spends
 * nothing — mail scanners follow links — only the tap does.
 */
export const dynamic = 'force-dynamic';

export default async function EntrarPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return <EnterButton token={t ?? ''} />;
}
