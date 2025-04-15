// src/lib/utils/rateLimiter.ts
export function rateLimiter(delayMs: number) {
    let lastCall = 0;
    return async () => {
      const now = Date.now();
      const waitTime = lastCall + delayMs - now;
      if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime));
      lastCall = Date.now();
    };
  }