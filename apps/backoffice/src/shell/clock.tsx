'use client';

import { useEffect, useState } from 'react';

const FORMAT = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Mexico City time, the console's one clock (usage months and digests run on it). */
export function Clock({ className }: { readonly className: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={className} suppressHydrationWarning>
      {now === null ? 'CDMX' : `${FORMAT.format(now)} · CDMX`}
    </span>
  );
}
