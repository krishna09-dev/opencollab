function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleRateLimitFromHeaders(headers: any) {
  const remaining = Number(headers?.["x-ratelimit-remaining"]);
  const resetUnix = Number(headers?.["x-ratelimit-reset"]); // seconds

  if (!Number.isFinite(remaining) || !Number.isFinite(resetUnix)) return;

  // If we're low, pause a bit
  if (remaining <= 5) {
    const nowMs = Date.now();
    const resetMs = resetUnix * 1000;
    const waitMs = Math.max(1000, resetMs - nowMs);

    // cap wait to 2 minutes to avoid huge stall
    const safeWait = Math.min(waitMs, 120_000);
    await sleep(safeWait);
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  tries = 3
): Promise<T> {
  let lastErr: any;

  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;

      // rate limited or server hiccup
      const shouldRetry = status === 403 || status === 429 || status === 502 || status === 503;

      if (!shouldRetry || i === tries - 1) break;

      const delay = 500 * Math.pow(2, i); // 500ms, 1s, 2s
      await sleep(delay);
    }
  }

  throw lastErr;
}