const windowMs = 60_000;
const maxRequests = 20;

const requests = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now >= entry.resetAt) requests.delete(key);
  }
}, 60_000);

export function checkRateLimit(clientIp: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = requests.get(clientIp);

  if (!entry || now >= entry.resetAt) {
    requests.set(clientIp, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}
