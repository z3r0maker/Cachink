/**
 * Marker interface for every use-case in @cachink/application.
 *
 * Use-cases are classes with constructor-injected repositories (never
 * concrete impls) and a single public `execute(input)` method. Input
 * types are re-validated with Zod at the boundary as defence-in-depth —
 * schemas already guard Drizzle writes but the UI can call a use-case
 * with partially validated data.
 */

export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
