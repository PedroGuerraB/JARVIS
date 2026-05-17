// Type-safe cast helpers for Supabase operations with hand-crafted Database types.
// When `generate_typescript_types` runs, these casts can be removed.
export function asInsert<T>(val: T): never {
  return val as never;
}

export function asUpdate<T>(val: T): never {
  return val as never;
}
