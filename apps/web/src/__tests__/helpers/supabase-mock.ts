/**
 * Creates a chainable Supabase query builder mock.
 * Any method call returns the same builder, and awaiting it resolves to `result`.
 *
 * Works for all chain patterns:
 *   from('t').select().eq().single()       → await resolves to result
 *   from('t').update({}).eq('id', x)       → await resolves to result
 *   from('t').insert({})                   → await resolves to result
 *   from('t').select().or().order()        → await resolves to result
 */
export function makeChain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const base: Record<string, unknown> = {
    then(onFulfilled: (v: unknown) => unknown) {
      return Promise.resolve(result).then(onFulfilled);
    },
    catch(onRejected: (e: unknown) => unknown) {
      return Promise.resolve(result).catch(onRejected);
    },
  };

  // proxy must be declared so the get trap can close over it
  const proxy: typeof base = new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target];
      // Return the proxy (not base) so chaining keeps going through the trap
      return (..._args: unknown[]) => proxy;
    },
  });

  return proxy;
}
