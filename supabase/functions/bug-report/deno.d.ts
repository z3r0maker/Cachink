/**
 * Types for the Deno-only parts of `index.ts`, so `tsc` can check the whole
 * function without Deno (F-10). Only the surface `index.ts` uses is declared;
 * if it starts using more, `tsc` says so here first.
 */
declare const Deno: { env: { get(name: string): string | undefined } };

declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  interface Filter {
    eq(column: string, value: string): Filter;
    gte(column: string, value: string): Promise<{ count: number | null }>;
  }
  interface Table {
    select(columns: string, options: { count: 'exact'; head: true }): Filter;
    insert(rows: readonly Record<string, unknown>[]): Promise<{ error: unknown }>;
  }
  export function createClient(url: string, key: string): { from(table: string): Table };
}
