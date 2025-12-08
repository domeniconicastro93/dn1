export function extractKeyValue(content: string, key: string): string | undefined {
  const regex = new RegExp(`"${key}"\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? match[1] : undefined;
}

export function safeJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  const num = Number(value);
  return (Number.isFinite(num) ? (num as unknown as T) : fallback) as T;
}

