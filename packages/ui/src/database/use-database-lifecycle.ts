/**
 * `useDatabaseLifecycle` — owns the async open / retry / reset state
 * machine for `<AsyncDatabaseProvider>`.
 *
 * Pulled out into its own hook so the provider component stays under
 * the CLAUDE.md §4.4 40-line ceiling. The lifecycle logic itself is
 * split into three composable sub-hooks (`useDatabaseOpener`,
 * `useCopyDetail`, `useResetFlow`) so each stays small and the main
 * orchestrator just wires them together.
 */
import { useEffect, useRef, useState } from 'react';
import type { CachinkDatabase } from '@cachink/data';
import type { ResetDatabaseFn } from './database-reset';

export interface DatabaseLifecycleState {
  readonly db: CachinkDatabase | null;
  readonly error: Error | null;
  readonly copied: boolean;
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly loading: boolean;
  readonly handleRetry: () => void;
  readonly handleCopy: () => void;
  readonly handleReset: () => Promise<void>;
  readonly setResetOpen: (open: boolean) => void;
}

interface DatabaseLifecycleArgs {
  readonly create: () => Promise<CachinkDatabase>;
  readonly reset?: ResetDatabaseFn;
  readonly preInitialised?: CachinkDatabase;
}

function normalizeError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

interface OpenerArgs {
  readonly create: () => Promise<CachinkDatabase>;
  readonly preInitialised?: CachinkDatabase;
  readonly retryToken: number;
  readonly setCopied: (v: boolean) => void;
}

interface OpenerSetters {
  readonly setDb: (db: CachinkDatabase | null) => void;
  readonly setError: (e: Error | null) => void;
  readonly setLoading: (v: boolean) => void;
  readonly setCopied: (v: boolean) => void;
}

function runCreate(create: () => Promise<CachinkDatabase>, setters: OpenerSetters): () => void {
  let mounted = true;
  setters.setDb(null);
  setters.setError(null);
  setters.setCopied(false);
  setters.setLoading(true);
  void create()
    .then((resolved) => {
      if (!mounted) return;
      setters.setDb(resolved);
      setters.setLoading(false);
    })
    .catch((err: unknown) => {
      const normalized = normalizeError(err);
      console.error('[DatabaseProvider] failed to initialize:', normalized);
      if (!mounted) return;
      setters.setError(normalized);
      setters.setLoading(false);
    });
  return (): void => {
    mounted = false;
  };
}

/** Owns the open / retry effect that produces the resolved database. */
function useDatabaseOpener(args: OpenerArgs): {
  readonly db: CachinkDatabase | null;
  readonly error: Error | null;
  readonly loading: boolean;
  readonly setError: (e: Error | null) => void;
} {
  const [db, setDb] = useState<CachinkDatabase | null>(args.preInitialised ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(args.preInitialised == null);
  useEffect(() => {
    if (args.preInitialised) {
      setDb(args.preInitialised);
      setError(null);
      args.setCopied(false);
      setLoading(false);
      return;
    }
    return runCreate(args.create, { setDb, setError, setLoading, setCopied: args.setCopied });
  }, [args.create, args.preInitialised, args.retryToken, args.setCopied]);
  return { db, error, loading, setError };
}

/**
 * Returns a handleCopy that copies the active error stack to the
 * clipboard. The caller threads the live error through the returned
 * `errorRef` (kept in sync via useEffect) so the click handler reads
 * the latest value at the moment the user copies.
 */
function useCopyDetail(): {
  readonly copied: boolean;
  readonly setCopied: (v: boolean) => void;
  readonly handleCopy: () => void;
  readonly errorRef: React.MutableRefObject<Error | null>;
} {
  const [copied, setCopied] = useState(false);
  const errorRef = useRef<Error | null>(null);
  const handleCopy = (): void => {
    const err = errorRef.current;
    const detail = err?.stack ?? err?.message ?? 'unknown';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(detail);
    }
    setCopied(true);
  };
  return { copied, setCopied, handleCopy, errorRef };
}

interface ResetArgs {
  readonly reset?: ResetDatabaseFn;
  readonly setError: (e: Error | null) => void;
  readonly bumpRetry: () => void;
  readonly setCopied: (v: boolean) => void;
}

/** Owns the destructive reset modal state + handler. */
function useResetFlow(args: ResetArgs): {
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly setResetOpen: (open: boolean) => void;
  readonly handleReset: () => Promise<void>;
} {
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const handleReset = async (): Promise<void> => {
    if (!args.reset) return;
    setResetting(true);
    try {
      await args.reset();
      setResetOpen(false);
      args.setCopied(false);
      args.bumpRetry();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      console.error('[DatabaseProvider] failed to reset:', normalized);
      args.setError(normalized);
      setResetOpen(false);
    } finally {
      setResetting(false);
    }
  };
  return { resetOpen, resetting, setResetOpen, handleReset };
}

export function useDatabaseLifecycle(args: DatabaseLifecycleArgs): DatabaseLifecycleState {
  const [retryToken, setRetryToken] = useState(0);
  const bumpRetry = (): void => setRetryToken((c) => c + 1);
  const copy = useCopyDetail();
  const opener = useDatabaseOpener({
    create: args.create,
    preInitialised: args.preInitialised,
    retryToken,
    setCopied: copy.setCopied,
  });
  // Keep the copy-detail ref pointed at the latest error so the
  // user-visible handleCopy reads the live stack at click time.
  copy.errorRef.current = opener.error;
  const resetFlow = useResetFlow({
    reset: args.reset,
    setError: opener.setError,
    bumpRetry,
    setCopied: copy.setCopied,
  });
  const handleRetry = (): void => {
    copy.setCopied(false);
    bumpRetry();
  };
  return {
    db: opener.db,
    error: opener.error,
    copied: copy.copied,
    resetOpen: resetFlow.resetOpen,
    resetting: resetFlow.resetting,
    loading: opener.loading,
    handleRetry,
    handleCopy: copy.handleCopy,
    handleReset: resetFlow.handleReset,
    setResetOpen: resetFlow.setResetOpen,
  };
}
