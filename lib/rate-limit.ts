type RateLimitResult = {
  ok: boolean;
  remaining: number;
  reset: number;
};

type RateLimitEntry = {
  count: number;
  reset: number;
};

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    const reset = now + windowMs;
    store.set(key, { count: 1, reset });
    return { ok: true, remaining: limit - 1, reset };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, reset: entry.reset };
  }

  entry.count += 1;
  store.set(key, entry);
  return { ok: true, remaining: limit - entry.count, reset: entry.reset };
}
