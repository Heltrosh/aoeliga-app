export function parseIntParam(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

// D1 .first() returns unknown | null; this helper makes intent explicit
export async function first<T = any>(stmt: D1PreparedStatement): Promise<T | null> {
  const row = await stmt.first();
  return (row as T) ?? null;
}